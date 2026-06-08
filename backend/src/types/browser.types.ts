export type BrowserStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export interface BrowserState {
  status: BrowserStatus;
  currentUrl: string;
  startedAt: Date | null;
  error: string | null;
}

export interface MouseClickPayload {
  x: number;
  y: number;
  button?: 'left' | 'right' | 'middle';
}

export interface KeyboardInputPayload {
  key?: string;
  text?: string;
}

export interface ScrollPayload {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
}

export interface NavigatePayload {
  url: string;
}

export interface BrowserFramePayload {
  image: string;
  timestamp: number;
}

export interface SessionInfo {
  status: BrowserStatus;
  currentUrl: string;
  startedAt: Date | null;
  uptime: number | null;
}