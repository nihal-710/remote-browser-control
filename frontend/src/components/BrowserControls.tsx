
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function BrowserControls() {
  const {
    browserStatus, socketStatus, loading,
    currentUrl, pageTitle, isNavigating,
    startBrowser, stopBrowser, navigateTo, goBack, goForward, refresh,
  } = useSocket();

  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  const isRunning = browserStatus === 'running';
  const isIdle = browserStatus === 'idle';
  const isConnected = socketStatus === 'connected';
  const isBusy = loading || browserStatus === 'starting' || browserStatus === 'stopping';

  // Sync url input placeholder when currentUrl changes
  useEffect(() => {
    setUrlError('');
  }, [currentUrl]);

  function handleNavigate(e: React.FormEvent) {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw) return;

    setUrlError('');

    // Auto-prepend https:// if missing
    let url = raw;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Basic validation
    try {
      new URL(url);
    } catch {
      setUrlError('Invalid URL');
      return;
    }

    navigateTo(url);
    setUrlInput('');
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Session Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Session</p>
        <div className="flex gap-2">
          <button
            onClick={startBrowser}
            disabled={!isIdle || !isConnected || isBusy}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy && !isRunning ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
            Start
          </button>
          <button
            onClick={stopBrowser}
            disabled={!isRunning || isBusy}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy && isRunning ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            )}
            Stop
          </button>
        </div>
      </div>

      {/* Navigation Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Navigation</p>
          {isNavigating && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400">
              <svg className="w-2.5 h-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
              </svg>
              Loading...
            </span>
          )}
        </div>

        {/* Back / Forward / Refresh */}
        <div className="flex gap-1.5 mb-2.5">
          {[
            { fn: goBack,    title: 'Back',    d: 'M19 12H5M12 5l-7 7 7 7' },
            { fn: goForward, title: 'Forward', d: 'M5 12h14M12 5l7 7-7 7' },
            { fn: refresh,   title: 'Refresh', d: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' },
          ].map(({ fn, title, d }) => (
            <button
              key={title}
              onClick={fn}
              disabled={!isRunning || isNavigating}
              title={title}
              className="flex-1 flex items-center justify-center h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d}/>
              </svg>
            </button>
          ))}
        </div>

        {/* URL Input */}
        <form onSubmit={handleNavigate} className="flex gap-1.5">
          <div className="relative flex-1">
            {isNavigating ? (
              <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                <svg className="w-3 h-3 text-yellow-500 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
                </svg>
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                </svg>
              </div>
            )}
            <input
              type="text"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
              placeholder={isRunning ? (currentUrl || 'https://...') : 'Start browser first'}
              disabled={!isRunning || isNavigating}
              className={`w-full h-7 pl-7 pr-2 rounded-md bg-zinc-800 border text-xs text-zinc-200 placeholder-zinc-600
                focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500
                disabled:opacity-40 disabled:cursor-not-allowed transition-all
                ${urlError ? 'border-red-500/50' : 'border-zinc-700'}`}
            />
          </div>
          <button
            type="submit"
            disabled={!isRunning || !urlInput.trim() || isNavigating}
            className="h-7 px-3 rounded-md text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Go
          </button>
        </form>
        {urlError && (
          <p className="mt-1.5 text-[10px] text-red-400">{urlError}</p>
        )}
      </div>

      {/* Current Page Info Card */}
      {isRunning && (currentUrl || pageTitle) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Current Page</p>
          {pageTitle && (
            <p className="text-xs text-zinc-300 font-medium truncate mb-1" title={pageTitle}>
              {pageTitle}
            </p>
          )}
          {currentUrl && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono truncate" title={currentUrl}>
                {extractDomain(currentUrl)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
