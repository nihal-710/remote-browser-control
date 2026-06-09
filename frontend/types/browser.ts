
export type BrowserStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export type SocketStatus = 'connected' | 'disconnected' | 'connecting';

export interface BrowserState {
  status: BrowserStatus;
  currentUrl: string;
  startedAt: Date | null;
  error: string | null;
}

export interface SessionInfo {
  status: BrowserStatus;
  currentUrl: string;
  startedAt: Date | null;
  uptime: number | null;
}
