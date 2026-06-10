import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { BrowserState, BrowserStatus, SessionInfo } from '../types/browser.types';
import { CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

type FrameCallback = (frame: { image: string; timestamp: number }) => void;

class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private streamInterval: NodeJS.Timeout | null = null;
  private frameCallback: FrameCallback | null = null;
  private isCapturing = false;

  private state: BrowserState = {
    status: 'idle',
    currentUrl: '',
    startedAt: null,
    error: null,
  };

  private constructor() {}

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  // ── Launch mode detection ──────────────────────────────────
  private useDocker(): boolean {
    return process.env.USE_DOCKER === 'true';
  }

  // ── Wait for CDP to be available ───────────────────────────
  private async waitForCDP(url: string, timeoutMs = 15000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(`${url}/json/version`);
        if (res.ok) return;
      } catch {
        // not ready yet
      }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`Chromium CDP not available at ${url} after ${timeoutMs}ms`);
  }

  async startBrowser(): Promise<void> {
    if (this.state.status === 'running') {
      logger.warn('Browser is already running');
      return;
    }

    this.setState('starting');

    try {
      if (this.useDocker()) {
        await this.startViaDocker();
      } else {
        await this.startLocal();
      }

      this.state.startedAt = new Date();
      this.setState('running');
      logger.info('Browser started successfully', {
        mode: this.useDocker() ? 'docker-cdp' : 'local',
        url: this.state.currentUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.state.error = message;
      this.setState('error');
      logger.error('Failed to start browser', { error: message });
      throw error;
    }
  }

  // ── Local launch (current working approach) ────────────────
  private async startLocal(): Promise<void> {
    logger.info('Launching Chromium locally...');
    const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

    this.browser = await chromium.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: CONFIG.BROWSER.WIDTH, height: CONFIG.BROWSER.HEIGHT },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    this.page = await this.context.newPage();
    this.attachPageListeners();

    await this.page.goto(CONFIG.BROWSER.DEFAULT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    this.state.currentUrl = this.page.url();
  }

  // ── Docker CDP connect ─────────────────────────────────────
  private async startViaDocker(): Promise<void> {
    const cdpUrl = process.env.CDP_URL || 'http://localhost:9222';
    logger.info(`Connecting to Chromium in Docker via CDP: ${cdpUrl}`);

    // Wait for container's Chromium to be ready
    await this.waitForCDP(cdpUrl);

    // Connect over CDP
    this.browser = await chromium.connectOverCDP(cdpUrl);

    // Use existing context (Chromium starts with one)
    const contexts = this.browser.contexts();
    if (contexts.length > 0) {
      this.context = contexts[0];
      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    } else {
      this.context = await this.browser.newContext({
        viewport: { width: CONFIG.BROWSER.WIDTH, height: CONFIG.BROWSER.HEIGHT },
      });
      this.page = await this.context.newPage();
    }

    // Set viewport explicitly
    await this.page.setViewportSize({
      width: CONFIG.BROWSER.WIDTH,
      height: CONFIG.BROWSER.HEIGHT,
    });

    this.attachPageListeners();

    await this.page.goto(CONFIG.BROWSER.DEFAULT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    this.state.currentUrl = this.page.url();
  }

  // ── Shared page listeners ──────────────────────────────────
  private attachPageListeners(): void {
    if (!this.page) return;
    this.page.on('framenavigated', (frame) => {
      if (frame === this.page?.mainFrame()) {
        this.state.currentUrl = frame.url();
      }
    });
  }

  async stopBrowser(): Promise<void> {
    if (this.state.status === 'idle') {
      logger.warn('Browser is already stopped');
      return;
    }

    this.stopStreaming();
    this.setState('stopping');
    logger.info('Stopping browser...');

    try {
      if (this.page) { await this.page.close().catch(() => {}); this.page = null; }
      if (this.context && !this.useDocker()) {
        await this.context.close().catch(() => {}); this.context = null;
      }
      if (this.browser) { await this.browser.close().catch(() => {}); this.browser = null; }

      this.state = { status: 'idle', currentUrl: '', startedAt: null, error: null };
      logger.info('Browser stopped successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.state.error = message;
      this.setState('error');
      throw error;
    }
  }

  startStreaming(callback: FrameCallback): void {
    if (this.streamInterval) return;
    if (!this.page) { logger.error('Cannot stream: no page'); return; }

    this.frameCallback = callback;
    this.isCapturing = false;

    this.streamInterval = setInterval(async () => {
      if (this.isCapturing || !this.page || !this.frameCallback) return;
      this.isCapturing = true;
      try {
        const buffer = await this.page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
        this.frameCallback({ image: `data:image/jpeg;base64,${buffer.toString('base64')}`, timestamp: Date.now() });
      } catch {
        // page may be navigating
      } finally {
        this.isCapturing = false;
      }
    }, CONFIG.SCREENSHOT_INTERVAL);

    logger.info('Screenshot streaming started');
  }

  stopStreaming(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
      this.frameCallback = null;
      this.isCapturing = false;
      logger.info('Streaming stopped');
    }
  }

  restartStreaming(): void {
  if (!this.frameCallback) {
    logger.warn('Cannot restart stream: no frame callback');
    return;
  }

  this.stopStreaming();

  if (!this.page) {
    logger.warn('Cannot restart stream: no page');
    return;
  }

  this.startStreaming(this.frameCallback);
  logger.info('Streaming restarted');
}

  getPage(): Page | null { return this.page; }
  getBrowserStatus(): BrowserState { return { ...this.state }; }

  getSessionInfo(): SessionInfo {
    const uptime = this.state.startedAt
      ? Math.floor((Date.now() - this.state.startedAt.getTime()) / 1000)
      : null;
    return {
      status: this.state.status,
      currentUrl: this.state.currentUrl,
      startedAt: this.state.startedAt,
      uptime,
    };
  }

  getMode(): string {
    return this.useDocker() ? 'Docker (CDP)' : 'Local';
  }

  private setState(status: BrowserStatus): void {
    this.state.status = status;
  }
}

export default BrowserManager.getInstance();