
export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Point;
  trail: Point[];
  direction: Point;
  length: number;
}

export interface DrawEvent {
  userId: string;
  color: string;
  start: Point;
  end: Point;
}

export type ActiveApp = 'desktop' | 'chalkboard';

export interface InitialStateEvent {
  users: User[];
  food: Point[];
}
