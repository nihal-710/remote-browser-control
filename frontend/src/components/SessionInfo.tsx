
'use client';

import { useSocket } from '../hooks/useSocket';

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className={`text-xs font-mono truncate max-w-[58%] text-right ${accent || 'text-zinc-300'}`}>{value}</span>
    </div>
  );
}

function formatUptime(s: number | null) {
  if (s === null) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const bColor: Record<string, string> = {
  idle: 'text-zinc-400', starting: 'text-yellow-400',
  running: 'text-emerald-400', stopping: 'text-orange-400', error: 'text-red-400',
};
const sColor: Record<string, string> = {
  connected: 'text-emerald-400', connecting: 'text-yellow-400', disconnected: 'text-red-400',
};

export default function SessionInfo() {
  const { browserStatus, socketStatus, currentUrl, pageTitle, uptime, startedAt, error } = useSocket();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Session Info</p>
      <Row label="Browser" value={browserStatus} accent={bColor[browserStatus]} />
      <Row label="Socket" value={socketStatus} accent={sColor[socketStatus]} />
      <Row label="Uptime" value={formatUptime(uptime)} />
      <Row label="Started" value={startedAt ? new Date(startedAt).toLocaleTimeString() : '—'} />
      {pageTitle && <Row label="Title" value={pageTitle} />}
      <Row label="URL" value={currentUrl || '—'} />
      {error && (
        <div className="mt-2 p-2 rounded-md bg-red-950 border border-red-900">
          <p className="text-[11px] text-red-400 break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
