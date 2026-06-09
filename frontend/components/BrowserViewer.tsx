
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useSocket } from '../hooks/useSocket';

interface RipplePoint {
  x: number;
  y: number;
  id: number;
}

const BROWSER_WIDTH = 1280;
const BROWSER_HEIGHT = 720;
const SCROLL_THROTTLE_MS = 32; // ~30 scroll events/sec max

const SPECIAL_KEYS = new Set([
  'Enter', 'Backspace', 'Tab', 'Escape', 'Delete',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

const IGNORED_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock',
  'NumLock', 'ScrollLock', 'Pause', 'Insert',
  'ContextMenu', 'OS',
]);

export default function BrowserViewer() {
  const { browserStatus, loading } = useSocket();
  const [frameSrc, setFrameSrc] = useState<string>('');
  const [frameTime, setFrameTime] = useState<string>('');
  const [ripples, setRipples] = useState<RipplePoint[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleCounter = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isRunning = browserStatus === 'running';
  const isStarting = browserStatus === 'starting' || (loading && !isRunning);

  // Receive frames
  useEffect(() => {
    const socket = getSocket();
    socket.on('browser-frame', (data: { image: string; timestamp: number }) => {
      setFrameSrc(data.image);
      setFrameTime(new Date(data.timestamp).toLocaleTimeString());
    });
    return () => { socket.off('browser-frame'); };
  }, []);

  // Clear on stop
  useEffect(() => {
    if (!isRunning) {
      setFrameSrc('');
      setFrameTime('');
      setRipples([]);
      setIsFocused(false);
      setIsScrolling(false);
    }
  }, [isRunning]);

  // ── Scroll handler ──────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!isRunning) return;

    // Prevent dashboard from scrolling
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastScrollTime.current < SCROLL_THROTTLE_MS) return;
    lastScrollTime.current = now;

    const socket = getSocket();
    socket.emit('mouse-scroll', {
      deltaX: Math.round(e.deltaX),
      deltaY: Math.round(e.deltaY),
    });

    // Show scrolling indicator briefly
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 500);
  }, [isRunning]);

  // ── Keyboard handler ────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isRunning) return;
    e.preventDefault();
    if (IGNORED_KEYS.has(e.key)) return;

    const socket = getSocket();

    if (e.ctrlKey && !IGNORED_KEYS.has(e.key)) {
      socket.emit('keyboard-input', { key: `Control+${e.key.toUpperCase()}` });
      return;
    }

    if (SPECIAL_KEYS.has(e.key)) {
      socket.emit('keyboard-input', { key: e.key });
    } else if (e.key.length === 1) {
      socket.emit('keyboard-input', { text: e.key });
    }
  }, [isRunning]);

  // ── Click handler ───────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRunning || !imgRef.current) return;

    viewerRef.current?.focus();

    const rect = imgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return;

    const browserX = Math.round((relX / rect.width) * BROWSER_WIDTH);
    const browserY = Math.round((relY / rect.height) * BROWSER_HEIGHT);

    getSocket().emit('mouse-click', { x: browserX, y: browserY, button: 'left' });

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const id = rippleCounter.current++;
      setRipples(prev => [...prev, {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
        id,
      }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }
  }, [isRunning]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

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

        <div className="flex items-center gap-2 shrink-0">
          {/* Scroll indicator */}
          {isRunning && isScrolling && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30">
              <svg className="w-2.5 h-2.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
              <span className="text-[10px] text-blue-400 font-medium">Scroll</span>
            </span>
          )}

          {/* Keyboard indicator */}
          {isRunning && isFocused && !isScrolling && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30">
              <svg className="w-2.5 h-2.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
              <span className="text-[10px] text-violet-400 font-medium">KB Active</span>
            </span>
          )}

          {/* Live badge */}
          {isRunning && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewerRef}
        tabIndex={isRunning ? 0 : -1}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onWheel={handleWheel}
        className={`flex-1 relative bg-zinc-950 min-h-0 overflow-hidden outline-none
          ${isRunning && frameSrc ? 'cursor-pointer' : 'cursor-default'}
          ${isFocused && isRunning ? 'ring-1 ring-inset ring-violet-500/40' : ''}
        `}
      >
        <div ref={containerRef} className="absolute inset-0" onClick={handleClick}>

          {/* Live stream */}
          {frameSrc && isRunning && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              src={frameSrc}
              alt="Browser stream"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Ripples */}
          {ripples.map(r => (
            <div
              key={r.id}
              className="absolute pointer-events-none"
              style={{ left: r.x, top: r.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-violet-400 animate-ping opacity-75" />
              <div
                className="absolute w-2 h-2 rounded-full bg-violet-400/70"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            </div>
          ))}
        </div>

        {/* Starting */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500">Launching Chromium...</p>
          </div>
        )}

        {/* Waiting for first frame */}
        {isRunning && !frameSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950 pointer-events-none">
            <div className="w-6 h-6 rounded-full border-2 border-violet-600/50 border-t-violet-400 animate-spin" />
            <p className="text-xs text-zinc-600">Waiting for first frame...</p>
          </div>
        )}

        {/* Empty state */}
        {!isRunning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 pointer-events-none">
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
          <span className="text-[10px] text-zinc-600">
            {isScrolling ? '↕ scrolling · ' : isFocused ? '⌨ kb active · ' : ''}2 fps · JPEG
          </span>
        </div>
      )}
    </div>
  );
}
