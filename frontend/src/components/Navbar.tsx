
'use client';

import { useSocket } from '@/hooks/useSocket';
import { BrowserStatus, SocketStatus } from '@/types/browser';

const socketBadge: Record<SocketStatus, { label: string; color: string; dot: string }> = {
  connected:    { label: 'Connected',    color: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', dot: 'bg-emerald-400' },
  connecting:   { label: 'Connecting',   color: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',   dot: 'bg-yellow-400 animate-pulse' },
  disconnected: { label: 'Disconnected', color: 'bg-red-500/10 text-red-400 ring-red-500/20',             dot: 'bg-red-400' },
};

const browserBadge: Record<BrowserStatus, { label: string; color: string; dot: string }> = {
  idle:     { label: 'Idle',     color: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',         dot: 'bg-zinc-400' },
  starting: { label: 'Starting', color: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',   dot: 'bg-yellow-400 animate-pulse' },
  running:  { label: 'Running',  color: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', dot: 'bg-emerald-400' },
  stopping: { label: 'Stopping', color: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',   dot: 'bg-orange-400 animate-pulse' },
  error:    { label: 'Error',    color: 'bg-red-500/10 text-red-400 ring-red-500/20',             dot: 'bg-red-400' },
};

function Badge({ label, color, dot }: { label: string; color: string; dot: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function Navbar() {
  const { socketStatus, browserStatus } = useSocket();
  const sb = socketBadge[socketStatus];
  const bb = browserBadge[browserStatus];

  return (
    <nav className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-screen-2xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Remote Browser Control</span>
          <span className="text-xs text-zinc-600 font-mono hidden sm:block">v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 mr-1 hidden sm:block">Socket</span>
          <Badge {...sb} />
          <div className="w-px h-4 bg-white/[0.08] mx-1" />
          <span className="text-xs text-zinc-600 mr-1 hidden sm:block">Browser</span>
          <Badge {...bb} />
        </div>
      </div>
    </nav>
  );
}
