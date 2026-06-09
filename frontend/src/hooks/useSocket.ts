
'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useBrowserStore } from '@/store/browserStore';
import { BrowserState, SessionInfo } from '@/types/browser';

export function useSocket() {
  const {
    setBrowserStatus,
    setSocketStatus,
    setLoading,
    setCurrentUrl,
    setError,
    setUptime,
    setStartedAt,
    browserStatus,
    socketStatus,
    loading,
    currentUrl,
    error,
    uptime,
    startedAt,
  } = useBrowserStore();

  useEffect(() => {
    const socket = getSocket();

    setSocketStatus('connecting');
    socket.connect();

    socket.on('connect', () => {
      setSocketStatus('connected');
      setError(null);
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('disconnected');
      setError('Failed to connect to backend server.');
    });

    socket.on('browser-status', (state: BrowserState) => {
      setBrowserStatus(state.status);
      setCurrentUrl(state.currentUrl || '');
      setError(state.error);
      setLoading(false);
    });

    socket.on('session-info', (info: SessionInfo) => {
      setUptime(info.uptime);
      setStartedAt(info.startedAt ? new Date(info.startedAt) : null);
      setCurrentUrl(info.currentUrl || '');
    });

    socket.on('url-changed', ({ url }: { url: string }) => {
      setCurrentUrl(url);
    });

    socket.on('browser-error', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('browser-status');
      socket.off('session-info');
      socket.off('url-changed');
      socket.off('browser-error');
    };
  }, []);

  const startBrowser = useCallback(() => {
    const socket = getSocket();
    setLoading(true);
    setError(null);
    socket.emit('start-browser');
  }, []);

  const stopBrowser = useCallback(() => {
    const socket = getSocket();
    setLoading(true);
    setError(null);
    socket.emit('stop-browser');
  }, []);

  const navigateTo = useCallback((url: string) => {
    const socket = getSocket();
    socket.emit('navigate-url', { url });
  }, []);

  const goBack = useCallback(() => {
    const socket = getSocket();
    socket.emit('navigate-back');
  }, []);

  const goForward = useCallback(() => {
    const socket = getSocket();
    socket.emit('navigate-forward');
  }, []);

  const refresh = useCallback(() => {
    const socket = getSocket();
    socket.emit('navigate-refresh');
  }, []);

  return {
    browserStatus,
    socketStatus,
    loading,
    currentUrl,
    error,
    uptime,
    startedAt,
    startBrowser,
    stopBrowser,
    navigateTo,
    goBack,
    goForward,
    refresh,
  };
}
