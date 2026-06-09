
'use client';

import { useSocket } from '@/hooks/useSocket';
import { BrowserStatus, SocketStatus } from '@/types/browser';

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs text-zinc-300 max-w-[55%] truncate text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

const statusColor: Record<BrowserStatus, string> = {
  idle:     'text-zinc-400',
  starting: 'text-yellow-400',
  running:  'text-emerald-400',
  stopping: 'text-orange-400',
  error:    'text-red-400',
};

const socketColor: Record<SocketStatus, string> = {
  connected:    'text-emerald-400',
  connecting:   'text-yellow-400',
  disconnected: 'text-red-400',
};

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function SessionInfo() {
  const { browserStatus, socketStatus, currentUrl, uptime, startedAt, error } = useSocket();

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Session Info</p>
      <div>
        <Row
          label="Browser"
          value={<span className={`capitalize font-medium ${statusColor[browserStatus]}`}>{browserStatus}</span>}
        />
        <Row
          label="Socket"
          value={<span className={`capitalize font-medium ${socketColor[socketStatus]}`}>{socketStatus}</span>}
        />
        <Row
          label="Uptime"
          value={formatUptime(uptime)}
          mono
        />
        <Row
          label="Started"
          value={startedAt ? new Date(startedAt).toLocaleTimeString() : '—'}
          mono
        />
        <Row
          label="Current URL"
          value={currentUrl || '—'}
          mono
        />
        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-xs text-red-400 break-words">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
