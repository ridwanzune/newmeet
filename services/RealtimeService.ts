// RealtimeService: Real multiplayer over WebSocket for snake game and WebRTC signaling

import { User, Point, PlayerState } from '../types';

type EventMap = {
  "initial-state": (data: { players: Record<string, PlayerState>, food: Point[] }) => void;
  "user-joined": (data: { player: User }) => void;
  "user-left": (data: { userId: string }) => void;
  "player-move": (data: { userId: string, state: PlayerState }) => void;
  "food-update": (data: { food: Point[] }) => void;
  "signal": (data: { from: string, signal: any }) => void;
};

type EventCallback<T = any> = (data: T) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private listeners: { [K in keyof EventMap]?: EventCallback[] } = {};
  private myUser: User | null = null;
  private url: string;

  constructor(url = "wss://newmeet-production.up.railway.app") {
    this.url = url;
  }

  public connect(user: User) {
    this.myUser = user;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.send({ type: 'join', userId: user.id, name: user.name, color: user.color });
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const type = msg.type as keyof EventMap;
      if (this.listeners[type]) {
        this.listeners[type]?.forEach(cb => cb(msg));
      }
    };
  }

  public sendPlayerMove(userId: string, state: PlayerState) {
    this.send({ type: "player-move", userId, state });
  }

  public eatFood(data: { userId: string, foodIndex: number }) {
    this.send({ type: "food-eaten", ...data });
  }

  public sendSignal(targetId: string, signal: any) {
    this.send({ type: "signal", targetId, signal });
  }

  public leave(userId: string) {
    this.send({ type: "leave", userId });
    this.ws?.close();
  }

  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public on<T extends keyof EventMap>(type: T, cb: EventMap[T]) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type]?.push(cb as EventCallback);
  }

  public off<T extends keyof EventMap>(type: T, cb: EventMap[T]) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type]?.filter(l => l !== cb);
  }
}

export const realtimeService = new RealtimeService();
