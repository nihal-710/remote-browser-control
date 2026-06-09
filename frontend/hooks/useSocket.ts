
'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useBrowserStore } from '../store/browserStore';
import { BrowserState, SessionInfo, PageInfo } from '../types/browser';

export function useSocket() {
  const store = useBrowserStore();

  useEffect(() => {
    const socket = getSocket();
    store.setSocketStatus('connecting');
    socket.connect();

    socket.on('connect', () => { store.setSocketStatus('connected'); store.setError(null); });
    socket.on('disconnect', () => { store.setSocketStatus('disconnected'); });
    socket.on('connect_error', () => {
      store.setSocketStatus('disconnected');
      store.setError('Failed to connect to backend.');
    });

    socket.on('browser-status', (state: BrowserState) => {
      store.setBrowserStatus(state.status);
      store.setCurrentUrl(state.currentUrl || '');
      store.setError(state.error);
      store.setLoading(false);
    });

    socket.on('session-info', (info: SessionInfo) => {
      store.setUptime(info.uptime);
      store.setStartedAt(info.startedAt ? new Date(info.startedAt) : null);
      store.setCurrentUrl(info.currentUrl || '');
    });

    socket.on('url-changed', ({ url }: { url: string }) => {
      store.setCurrentUrl(url);
      store.setIsNavigating(false);
    });

    socket.on('page-info', (info: PageInfo) => {
      store.setCurrentUrl(info.url);
      store.setPageTitle(info.title);
      store.setIsNavigating(false);
    });

    socket.on('page-loading', () => { store.setIsNavigating(true); });
    socket.on('page-loaded', () => { store.setIsNavigating(false); });

    socket.on('browser-error', ({ message }: { message: string }) => {
      store.setError(message);
      store.setLoading(false);
      store.setIsNavigating(false);
    });

    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('connect_error');
      socket.off('browser-status'); socket.off('session-info'); socket.off('url-changed');
      socket.off('page-info'); socket.off('page-loading'); socket.off('page-loaded');
      socket.off('browser-error');
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
    store.setIsNavigating(true);
    getSocket().emit('browser-back');
  }, []);

  const goForward = useCallback(() => {
    store.setIsNavigating(true);
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

