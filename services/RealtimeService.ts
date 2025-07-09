import { User, Point, DrawEvent, PlayerState, InitialStateEvent } from '../types';
import { MAX_USERS, USER_COLORS, MAX_FOOD_DOTS, FOOD_SPAWN_INTERVAL } from '../constants';

type EventCallback = (data: any) => void;

class RealtimeService {
  private users: User[] = [];
  private listeners: Record<string, EventCallback[]> = {};
  private foodDots: Point[] = [];
  private foodSpawner: number | null = null;

  constructor() {
    // This is a mock service. In a real application, you would connect to a
    // WebSocket server here.
    this.initializeFood();
    this.startFoodSpawner();
  }

  private initializeFood(): void {
    this.foodDots = [];
    for (let i = 0; i < MAX_FOOD_DOTS; i++) {
        this.addFood();
    }
  }

  private addFood(): void {
    this.foodDots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
    });
  }

  private startFoodSpawner(): void {
      if (this.foodSpawner) clearInterval(this.foodSpawner);
      this.foodSpawner = setInterval(() => {
          if (this.foodDots.length < MAX_FOOD_DOTS) {
              this.addFood();
              this.emit('food-state-updated', this.foodDots);
          }
      }, FOOD_SPAWN_INTERVAL) as unknown as number;
  }

  // --- Event Emitter Methods ---
  public on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  private emit(event: string, data: any): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
  
  private emitToAllBut(emitterId: string, event: string, data: any): void {
    // In a real server, you'd send to all other clients. Here, we just call the listeners.
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  // --- User Management ---
  public join(): User | null {
    if (this.users.length >= MAX_USERS) {
      console.warn("Room is full. Cannot join.");
      return null;
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userIndex = this.users.length;
    const newUser: User = {
      id: userId,
      name: `User ${userIndex + 1}`,
      color: USER_COLORS[userIndex % USER_COLORS.length],
    };

    // Notify existing users about the new user
    this.emit('user-joined', newUser);
    
    this.users.push(newUser);

    // Notify the new user about the complete current state
    const initialState: InitialStateEvent = {
        users: this.users,
        food: this.foodDots,
    };
    setTimeout(() => this.emit('initial-state', initialState), 0);
    
    return newUser;
  }
  
  public updateUserName(userId: string, name: string): void {
    const user = this.users.find(u => u.id === userId);
    if(user) {
        user.name = name;
        this.emit('user-updated', user);
    }
  }

  public leave(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
    this.emit('user-left', userId);
    console.log(`User ${userId} left.`);
  }

  // --- Real-time Actions ---
  public updatePlayerPosition(userId: string, playerState: PlayerState): void {
    // In a real app, we'd broadcast to others. Here we emit to all, including self.
    this.emit('player-moved', { userId, playerState });
  }

  public draw(drawEvent: DrawEvent): void {
    this.emit('drawing-data', drawEvent);
  }
  
  public eatFood(data: {userId: string; foodIndex: number}): void {
    if (this.foodDots[data.foodIndex]) {
        this.foodDots.splice(data.foodIndex, 1);
        this.emit('food-state-updated', this.foodDots);
    }
  }
}

export const realtimeService = new RealtimeService();