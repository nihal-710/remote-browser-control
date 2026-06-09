
import { create } from 'zustand';
import { BrowserStatus, SocketStatus } from '../types/browser';

interface BrowserStore {
  browserStatus: BrowserStatus;
  socketStatus: SocketStatus;
  loading: boolean;
  currentUrl: string;
  error: string | null;
  uptime: number | null;
  startedAt: Date | null;

  setBrowserStatus: (status: BrowserStatus) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setLoading: (loading: boolean) => void;
  setCurrentUrl: (url: string) => void;
  setError: (error: string | null) => void;
  setUptime: (uptime: number | null) => void;
  setStartedAt: (date: Date | null) => void;
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  browserStatus: 'idle',
  socketStatus: 'disconnected',
  loading: false,
  currentUrl: '',
  error: null,
  uptime: null,
  startedAt: null,

  setBrowserStatus: (status) => set({ browserStatus: status }),
  setSocketStatus: (status) => set({ socketStatus: status }),
  setLoading: (loading) => set({ loading }),
  setCurrentUrl: (url) => set({ currentUrl: url }),
  setError: (error) => set({ error }),
  setUptime: (uptime) => set({ uptime }),
  setStartedAt: (date) => set({ startedAt: date }),
}));
