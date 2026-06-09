import { Server, Socket } from 'socket.io';
import BrowserManager from '../services/BrowserManager';
import {
  MouseClickPayload,
  KeyboardInputPayload,
  ScrollPayload,
  NavigatePayload,
} from '../types/browser.types';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });
    socket.emit('browser-status', BrowserManager.getBrowserStatus());

    // ── Start Browser ──────────────────────────────────────────
    socket.on('start-browser', async () => {
      logger.info('Event: start-browser');
      try {
        await BrowserManager.startBrowser();
        io.emit('browser-status', BrowserManager.getBrowserStatus());
        io.emit('session-info', BrowserManager.getSessionInfo());

        // Start streaming frames to all connected clients
        BrowserManager.startStreaming((frame) => {
          io.emit('browser-frame', frame);
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('browser-error', { message });
        io.emit('browser-status', BrowserManager.getBrowserStatus());
      }
    });

    // ── Stop Browser ───────────────────────────────────────────
    socket.on('stop-browser', async () => {
      logger.info('Event: stop-browser');
      try {
        await BrowserManager.stopBrowser();
        io.emit('browser-status', BrowserManager.getBrowserStatus());
        io.emit('session-info', BrowserManager.getSessionInfo());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('browser-error', { message });
      }
    });

    // ── Mouse Click ────────────────────────────────────────────
    socket.on('mouse-click', async (payload: MouseClickPayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        await page.mouse.click(payload.x, payload.y, { button: payload.button || 'left' });
        io.emit('url-changed', { url: page.url() });
      } catch (error) {
        logger.error('mouse-click error', { error });
      }
    });

    // ── Keyboard Input ─────────────────────────────────────────
    socket.on('keyboard-input', async (payload: KeyboardInputPayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        if (payload.text) await page.keyboard.type(payload.text);
        else if (payload.key) await page.keyboard.press(payload.key);
      } catch (error) {
        logger.error('keyboard-input error', { error });
      }
    });

    // ── Mouse Scroll ───────────────────────────────────────────
    socket.on('mouse-scroll', async (payload: ScrollPayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        await page.mouse.move(payload.x, payload.y);
        await page.mouse.wheel(payload.deltaX, payload.deltaY);
      } catch (error) {
        logger.error('mouse-scroll error', { error });
      }
    });

    // ── Navigate URL ───────────────────────────────────────────
    socket.on('navigate-url', async (payload: NavigatePayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        let url = payload.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        io.emit('url-changed', { url: page.url() });
        io.emit('session-info', BrowserManager.getSessionInfo());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('browser-error', { message });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}