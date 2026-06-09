
'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useSocket } from '../hooks/useSocket';

export default function BrowserViewer() {
  const { browserStatus, loading } = useSocket();
  const [frameSrc, setFrameSrc] = useState<string>('');
  const [frameTime, setFrameTime] = useState<string>('');

  const isRunning = browserStatus === 'running';
  const isStarting = browserStatus === 'starting' || (loading && !isRunning);

  useEffect(() => {
    const socket = getSocket();

    socket.on('browser-frame', (data: { image: string; timestamp: number }) => {
      setFrameSrc(data.image);
      setFrameTime(new Date(data.timestamp).toLocaleTimeString());
    });

    return () => {
      socket.off('browser-frame');
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setFrameSrc('');
      setFrameTime('');
    }
  }, [isRunning]);

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full">

      {/* Browser Chrome Bar */}
      <div className="flex items-center gap-2 h-9 px-3 bg-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <div className="flex-1 mx-2 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center px-2 gap-1.5">
          <svg className="w-2.5 h-2.5 text-zinc-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
          <span className="text-[10px] text-zinc-500 font-mono truncate">
            {isRunning ? 'chromium — live stream' : 'about:blank'}
          </span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Viewport */}
      <div className="flex-1 relative bg-zinc-950 min-h-0 overflow-hidden">

        {/* Live stream image */}
        {frameSrc && isRunning && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frameSrc}
              alt="Browser stream"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        )}

        {/* Starting */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
            <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500">Launching Chromium...</p>
          </div>
        )}

        {/* Waiting for first frame */}
        {isRunning && !frameSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950">
            <div className="w-6 h-6 rounded-full border-2 border-violet-600/50 border-t-violet-400 animate-spin" />
            <p className="text-xs text-zinc-600">Waiting for first frame...</p>
          </div>
        )}

        {/* Empty state */}
        {!isRunning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-400">No browser session</p>
              <p className="text-xs text-zinc-600 mt-1">Start a session to stream Chromium here</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Click',  icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5' },
                { label: 'Type',   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { label: 'Scroll', icon: 'M12 5v14M19 12l-7 7-7-7' },
              ].map(({ label, icon }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-800">
                  <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon}/>
                  </svg>
                  <span className="text-[10px] text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {isRunning && frameTime && (
        <div className="h-6 px-3 flex items-center justify-between bg-zinc-950 border-t border-zinc-800 shrink-0">
          <span className="text-[10px] text-zinc-600 font-mono">frame @ {frameTime}</span>
          <span className="text-[10px] text-zinc-600">2 fps · JPEG</span>
        </div>
      )}
    </div>
  );
}
