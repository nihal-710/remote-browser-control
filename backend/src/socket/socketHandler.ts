import { Server, Socket } from 'socket.io';
import BrowserManager from '../services/BrowserManager';
import {
  MouseClickPayload,
  KeyboardInputPayload,
  ScrollPayload,
  NavigatePayload,
} from '../types/browser.types';
import { logger } from '../utils/logger';

async function emitPageInfo(io: Server, page: import('playwright').Page) {
  try {
    const url = page.url();
    const title = await page.title().catch(() => '');
    logger.info('[NAV] emitPageInfo', { url, title });
    io.emit('page-info', { url, title });
    io.emit('url-changed', { url });
  } catch {
    // page may be navigating
  }
}

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

        const page = BrowserManager.getPage();
        if (page) await emitPageInfo(io, page);

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

    // ── Navigate URL ───────────────────────────────────────────
    socket.on('navigate-url', async (payload: NavigatePayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        let url = payload.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        logger.info('[NAV] navigate-url', { url });
        io.emit('page-loading');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        io.emit('page-loaded');
        await emitPageInfo(io, page);
        io.emit('session-info', BrowserManager.getSessionInfo());
        BrowserManager.restartStreaming();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Navigation failed';
        socket.emit('browser-error', { message });
        io.emit('page-loaded');
      }
    });

    // ── Back ───────────────────────────────────────────────────
    socket.on('browser-back', async () => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        logger.info('[NAV] browser-back');
        io.emit('page-loading');
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
        io.emit('page-loaded');
        await emitPageInfo(io, page);
        BrowserManager.restartStreaming();
      } catch {
        io.emit('page-loaded');
        socket.emit('browser-error', { message: 'No previous page in history' });
      }
    });

    // ── Forward ────────────────────────────────────────────────
    socket.on('browser-forward', async () => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        logger.info('[NAV] browser-forward');
        io.emit('page-loading');
        await page.goForward({ waitUntil: 'domcontentloaded', timeout: 10000 });
        io.emit('page-loaded');
        await emitPageInfo(io, page);
        BrowserManager.restartStreaming();
      } catch {
        io.emit('page-loaded');
        socket.emit('browser-error', { message: 'No forward page in history' });
      }
    });

    // ── Refresh ────────────────────────────────────────────────
    socket.on('browser-refresh', async () => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        logger.info('[NAV] browser-refresh');
        io.emit('page-loading');
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        io.emit('page-loaded');
        await emitPageInfo(io, page);
        BrowserManager.restartStreaming();
      } catch (error) {
        io.emit('page-loaded');
        const message = error instanceof Error ? error.message : 'Refresh failed';
        socket.emit('browser-error', { message });
      }
    });

    // ── Mouse Click ────────────────────────────────────────────
    socket.on('mouse-click', async (payload: MouseClickPayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        await page.mouse.click(payload.x, payload.y, { button: payload.button || 'left' });
        setTimeout(async () => {
          const currentPage = BrowserManager.getPage();
          if (currentPage) {
            await emitPageInfo(io, currentPage);
            // If click triggered navigation, restart stream
            if (currentPage.url() !== page.url()) {
              BrowserManager.restartStreaming();
            }
          }
        }, 800);
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
        if (payload.key === 'Enter') {
          setTimeout(async () => {
            const currentPage = BrowserManager.getPage();
            if (currentPage) await emitPageInfo(io, currentPage);
          }, 1000);
        }
      } catch (error) {
        logger.error('keyboard-input error', { error });
      }
    });

    // ── Mouse Scroll ───────────────────────────────────────────
    socket.on('mouse-scroll', async (payload: ScrollPayload) => {
      const page = BrowserManager.getPage();
      if (!page) return;
      try {
        await page.mouse.move(640, 360);
        await page.mouse.wheel(payload.deltaX, payload.deltaY);
      } catch (error) {
        logger.error('mouse-scroll error', { error });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}