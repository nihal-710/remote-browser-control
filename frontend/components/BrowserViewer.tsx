
'use client';

import { useSocket } from '../hooks/useSocket';

export default function BrowserViewer() {
  const { browserStatus, loading } = useSocket();
  const isRunning = browserStatus === 'running';
  const isStarting = browserStatus === 'starting' || loading;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/40" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/40" />
        </div>
        <div className="flex-1 mx-3 rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-1">
          <p className="text-xs text-zinc-600 font-mono truncate">
            {isRunning ? 'Live stream active in Phase 4' : 'No active session'}
          </p>
        </div>
        {isRunning && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isStarting && !isRunning ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <p className="text-sm text-zinc-500">Starting browser session...</p>
          </div>
        ) : isRunning ? (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Browser is running</p>
              <p className="text-xs text-zinc-600 mt-1">Live stream will be implemented in Phase 4</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Session Active</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">No active browser session</p>
              <p className="text-xs text-zinc-600 mt-1">Click <span className="text-violet-400">Start Browser</span> to begin</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-xs">
              {['Click', 'Type', 'Scroll'].map((feat) => (
                <div key={feat} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-center">
                  <p className="text-xs text-zinc-500">{feat}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
