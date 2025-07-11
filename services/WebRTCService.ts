// WebRTCService with signaling server integration for peer-to-peer audio

type SignalCallback = (targetId: string, signal: any) => void;

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Record<string, RTCPeerConnection> = {};
  private myId: string | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioLevelCallback: ((level: number) => void) | null = null;
  private animationFrameId: number | null = null;

  private sendSignal: SignalCallback | null = null;

  private iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  public async start(myId: string, sendSignal: SignalCallback): Promise<void> {
    this.myId = myId;
    this.sendSignal = sendSignal;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.setupAudioAnalysis();
    } catch (error) {
      console.error("Error accessing media devices.", error);
      throw error;
    }
  }

  public async callPeer(targetId: string) {
    if (!this.myId || !this.localStream || !this.sendSignal) return;
    if (this.peerConnections[targetId]) return;

    const pc = this.createPeerConnection(targetId);

    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.sendSignal(targetId, { sdp: pc.localDescription });
  }

  private createPeerConnection(targetId: string): RTCPeerConnection {
    if (this.peerConnections[targetId]) return this.peerConnections[targetId];
    const pc = new RTCPeerConnection(this.iceConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate && this.sendSignal) {
        this.sendSignal(targetId, { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
    };

    this.peerConnections[targetId] = pc;
    return pc;
  }

  public async handleSignal(fromId: string, signal: any) {
    let pc = this.peerConnections[fromId] || this.createPeerConnection(fromId);

    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      if (signal.sdp.type === 'offer') {
        if (!this.localStream) return;
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream!);
        });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.sendSignal) this.sendSignal(fromId, { sdp: pc.localDescription });
      }
    } else if (signal.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (err) {
        console.warn("Error adding ICE candidate", err);
      }
    }
  }

  public onAudioLevelChange(callback: (level: number) => void) {
    this.audioLevelCallback = callback;
  }

  private setupAudioAnalysis() {
    if (!this.localStream || this.localStream.getAudioTracks().length === 0) return;
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    source.connect(this.analyser);
    this.pollAudioLevel();
  }

  private pollAudioLevel = () => {
    if (this.analyser && this.dataArray && this.audioLevelCallback) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (const amplitude of this.dataArray) {
        sum += amplitude * amplitude;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      const normalized = rms / 128;
      const level = Math.min(normalized, 1);
      this.audioLevelCallback(level);
    }
    this.animationFrameId = requestAnimationFrame(this.pollAudioLevel);
  }

  public toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public disconnectFrom(targetId: string): void {
    if (this.peerConnections[targetId]) {
      this.peerConnections[targetId].close();
      delete this.peerConnections[targetId];
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    Object.keys(this.peerConnections).forEach(id => {
      this.disconnectFrom(id);
    });
    this.audioLevelCallback = null;
    this.sendSignal = null;
  }
}

export const webRTCService = new WebRTCService();
