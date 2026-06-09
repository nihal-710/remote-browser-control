
'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function BrowserControls() {
  const { browserStatus, socketStatus, loading, currentUrl, startBrowser, stopBrowser, navigateTo, goBack, goForward, refresh } = useSocket();
  const [urlInput, setUrlInput] = useState('');

  const isRunning = browserStatus === 'running';
  const isIdle = browserStatus === 'idle';
  const isConnected = socketStatus === 'connected';
  const isBusy = loading || browserStatus === 'starting' || browserStatus === 'stopping';

  function handleNavigate(e: React.FormEvent) {
    e.preventDefault();
    if (urlInput.trim()) {
      navigateTo(urlInput.trim());
      setUrlInput('');
    }
  }

  return (
    <div className="space-y-3">
      {/* Browser Power Controls */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Session</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startBrowser}
            disabled={!isIdle || !isConnected || isBusy}
            className="relative flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150
              bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-violet-600
              focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            {isBusy && !isRunning ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
            Start
          </button>

          <button
            onClick={stopBrowser}
            disabled={!isRunning || isBusy}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150
              bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08]
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-white/10"
          >
            {isBusy && isRunning ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
            )}
            Stop
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Navigation</p>

        {/* Back / Forward / Refresh */}
        <div className="flex gap-1.5 mb-3">
          {[
            { action: goBack, title: 'Back', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /> },
            { action: goForward, title: 'Forward', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /> },
            { action: refresh, title: 'Refresh', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> },
          ].map(({ action, title, icon }) => (
            <button
              key={title}
              onClick={action}
              disabled={!isRunning}
              title={title}
              className="flex-1 flex items-center justify-center rounded-lg p-2 text-zinc-400
                bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06]
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                {icon}
              </svg>
            </button>
          ))}
        </div>

        {/* URL Input */}
        <form onSubmit={handleNavigate} className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
              </svg>
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={isRunning ? (currentUrl || 'Enter URL...') : 'Start browser first'}
              disabled={!isRunning}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600
                focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!isRunning || !urlInput.trim()}
            className="rounded-lg px-3 py-2 text-xs font-medium bg-violet-600/80 hover:bg-violet-600 text-white
              disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
