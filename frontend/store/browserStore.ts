
import { create } from 'zustand';
import { BrowserStatus, SocketStatus } from '../types/browser';

interface BrowserStore {
  browserStatus: BrowserStatus;
  socketStatus: SocketStatus;
  loading: boolean;
  currentUrl: string;
  pageTitle: string;
  isNavigating: boolean;
  error: string | null;
  uptime: number | null;
  startedAt: Date | null;

  setBrowserStatus: (status: BrowserStatus) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setLoading: (loading: boolean) => void;
  setCurrentUrl: (url: string) => void;
  setPageTitle: (title: string) => void;
  setIsNavigating: (v: boolean) => void;
  setError: (error: string | null) => void;
  setUptime: (uptime: number | null) => void;
  setStartedAt: (date: Date | null) => void;
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  browserStatus: 'idle',
  socketStatus: 'disconnected',
  loading: false,
  currentUrl: '',
  pageTitle: '',
  isNavigating: false,
  error: null,
  uptime: null,
  startedAt: null,

  setBrowserStatus: (status) => set({ browserStatus: status }),
  setSocketStatus: (status) => set({ socketStatus: status }),
  setLoading: (loading) => set({ loading }),
  setCurrentUrl: (url) => set({ currentUrl: url }),
  setPageTitle: (title) => set({ pageTitle: title }),
  setIsNavigating: (v) => set({ isNavigating: v }),
  setError: (error) => set({ error }),
  setUptime: (uptime) => set({ uptime }),
  setStartedAt: (date) => set({ startedAt: date }),
}));
