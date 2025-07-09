type PlayerState = {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  direction: { x: number; y: number };
  length: number;
  trail: any[];
};

type EventMap = {
  "initial-state": (data: { players: Record<string, PlayerState>, food: any[] }) => void;
  "user-joined": (data: { player: PlayerState }) => void;
  "player-move": (data: { userId: string, state: PlayerState }) => void;
  "user-left": (data: { userId: string }) => void;
  "food-update": (data: { food: any[] }) => void;
  "signal": (data: { from: string, signal: any }) => void;
};

class RealtimeService {
  private ws: WebSocket | null = null;
  private listeners: { [K in keyof EventMap]?: EventMap[K][] } = {};

  public connect(user: PlayerState, url = "wss://newmeet-production.up.railway.app") {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.send({ type: 'join', ...user });
    };
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const type = msg.type as keyof EventMap;
      this.listeners[type]?.forEach(cb => cb(msg));
    };
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public on<T extends keyof EventMap>(type: T, cb: EventMap[T]) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type]?.push(cb);
  }
}

export const realtimeService = new RealtimeService();
