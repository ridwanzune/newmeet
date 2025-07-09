// A NOTE ON THIS IMPLEMENTATION:
// True WebRTC requires a "signaling server" to exchange connection information
// (like SDP and ICE candidates) between peers before a direct connection can be
// established. Since this is a frontend-only project, we cannot implement a
// signaling server.
//
// This service will correctly:
// 1. Request and manage the user's microphone stream.
// 2. Analyze the local audio stream to provide volume levels.
// 3. Set up the basic RTCPeerConnection objects.
//
// It will NOT be able to:
// 1. Discover other peers.
// 2. Exchange signaling messages.
// 3. Establish a connection and stream audio between different browsers/users.
//
// The code structure is a template for how it *would* work with a signaling
// service (e.g., via WebSockets) integrated.

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Record<string, RTCPeerConnection> = {};
  private myId: string | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioLevelCallback: ((level: number) => void) | null = null;
  private animationFrameId: number | null = null;

  private iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  public async start(myId: string): Promise<void> {
    this.myId = myId;
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
        // Calculate RMS, normalize, and apply a boost factor
        const rms = Math.sqrt(sum / this.dataArray.length);
        const normalized = rms / 128; // Normalize from 0-255 range to 0-2
        const level = Math.min(normalized, 1); // Clamp at 1
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

  public connectTo(targetId: string): void {
    if (!this.localStream || !this.myId || this.peerConnections[targetId]) {
      return;
    }
    console.log(`[WebRTC] Attempting to connect to ${targetId}`);
    
    const pc = new RTCPeerConnection(this.iceConfig);
    this.peerConnections[targetId] = pc;

    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${targetId}`);
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
    };

    pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state with ${targetId}: ${pc.connectionState}`);
    }
  }

  public disconnectFrom(targetId: string): void {
    if (this.peerConnections[targetId]) {
      this.peerConnections[targetId].close();
      delete this.peerConnections[targetId];
      console.log(`[WebRTC] Disconnected from ${targetId}`);
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
    console.log("[WebRTC] Service stopped.");
  }
}

export const webRTCService = new WebRTCService();