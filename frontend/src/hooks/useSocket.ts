'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { useBrowserStore } from '../store/browserStore';
import { BrowserState, SessionInfo, PageInfo } from '../types/browser';

export function useSocket() {
  const store = useBrowserStore();
  const handlersRef = useRef<Record<string, (...args: any[]) => void>>({});

  useEffect(() => {
    const socket = getSocket();
    store.setSocketStatus('connecting');
    socket.connect();

    const handlers: Record<string, (...args: any[]) => void> = {
      connect:        () => { store.setSocketStatus('connected'); store.setError(null); },
      disconnect:     () => { store.setSocketStatus('disconnected'); },
      connect_error:  () => { store.setSocketStatus('disconnected'); store.setError('Failed to connect to backend.'); },

      'browser-status': (state: BrowserState) => {
        store.setBrowserStatus(state.status);
        store.setCurrentUrl(state.currentUrl || '');
        store.setError(state.error);
        store.setLoading(false);
      },
      'session-info': (info: SessionInfo) => {
        store.setUptime(info.uptime);
        store.setStartedAt(info.startedAt ? new Date(info.startedAt) : null);
        store.setCurrentUrl(info.currentUrl || '');
      },
      'url-changed':  ({ url }: { url: string }) => { store.setCurrentUrl(url); store.setIsNavigating(false); },
      'page-info':    (info: PageInfo) => { store.setCurrentUrl(info.url); store.setPageTitle(info.title); store.setIsNavigating(false); },
      'page-loading': () => { store.setIsNavigating(true); },
      'page-loaded':  () => { store.setIsNavigating(false); },
      'browser-error': ({ message }: { message: string }) => {
        store.setError(message);
        store.setLoading(false);
        store.setIsNavigating(false);
      },
    };

    // Remove any stale listeners first, then register fresh ones
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.off(event);          // clear any duplicate from previous mount
      socket.on(event, handler);
    });

    handlersRef.current = handlers;

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler); // remove only THIS mount's handlers
      });
    };
  }, []);

  const startBrowser = useCallback(() => {
    store.setLoading(true); store.setError(null);
    getSocket().emit('start-browser');
  }, []);

  const stopBrowser = useCallback(() => {
    store.setLoading(true); store.setError(null);
    getSocket().emit('stop-browser');
  }, []);

  const navigateTo = useCallback((url: string) => {
    store.setIsNavigating(true); store.setError(null);
    getSocket().emit('navigate-url', { url });
  }, []);

  const goBack = useCallback(() => {
    // Don't optimistically set navigating — let backend confirm
    store.setError(null);
    getSocket().emit('browser-back');
  }, []);

  const goForward = useCallback(() => {
    store.setError(null);
    getSocket().emit('browser-forward');
  }, []);

  const refresh = useCallback(() => {
    store.setIsNavigating(true);
    getSocket().emit('browser-refresh');
  }, []);

  return {
    browserStatus: store.browserStatus,
    socketStatus: store.socketStatus,
    loading: store.loading,
    currentUrl: store.currentUrl,
    pageTitle: store.pageTitle,
    isNavigating: store.isNavigating,
    error: store.error,
    uptime: store.uptime,
    startedAt: store.startedAt,
    startBrowser,
    stopBrowser,
    navigateTo,
    goBack,
    goForward,
    refresh,
  };
}