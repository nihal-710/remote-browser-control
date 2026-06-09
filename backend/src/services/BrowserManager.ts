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

  async startBrowser(): Promise<void> {
    if (this.state.status === 'running') {
      logger.warn('Browser is already running');
      return;
    }

    this.setState('starting');
    logger.info('Starting Chromium browser...');

    try {
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
        viewport: {
          width: CONFIG.BROWSER.WIDTH,
          height: CONFIG.BROWSER.HEIGHT,
        },
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      this.page = await this.context.newPage();

      this.page.on('framenavigated', (frame) => {
        if (frame === this.page?.mainFrame()) {
          this.state.currentUrl = frame.url();
        }
      });

      await this.page.goto(CONFIG.BROWSER.DEFAULT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      this.state.currentUrl = this.page.url();
      this.state.startedAt = new Date();
      this.setState('running');
      logger.info('Browser started successfully', { url: this.state.currentUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.state.error = message;
      this.setState('error');
      logger.error('Failed to start browser', { error: message });
      throw error;
    }
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
      if (this.page) { await this.page.close(); this.page = null; }
      if (this.context) { await this.context.close(); this.context = null; }
      if (this.browser) { await this.browser.close(); this.browser = null; }

      this.state = { status: 'idle', currentUrl: '', startedAt: null, error: null };
      logger.info('Browser stopped successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.state.error = message;
      this.setState('error');
      logger.error('Failed to stop browser', { error: message });
      throw error;
    }
  }

  startStreaming(callback: FrameCallback): void {
    if (this.streamInterval) {
      logger.warn('Streaming already active');
      return;
    }

    if (!this.page) {
      logger.error('Cannot start streaming: no page available');
      return;
    }

    this.frameCallback = callback;
    this.isCapturing = false;
    logger.info('Starting screenshot stream...');

    this.streamInterval = setInterval(async () => {
      if (this.isCapturing || !this.page || !this.frameCallback) return;

      this.isCapturing = true;
      try {
        const buffer = await this.page.screenshot({
          type: 'jpeg',
          quality: 60,
          fullPage: false,
        });

        const image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        this.frameCallback({ image, timestamp: Date.now() });
      } catch (error) {
        logger.error('Screenshot capture failed', { error });
      } finally {
        this.isCapturing = false;
      }
    }, CONFIG.SCREENSHOT_INTERVAL);
  }

  stopStreaming(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
      this.frameCallback = null;
      this.isCapturing = false;
      logger.info('Screenshot stream stopped');
    }
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

  private setState(status: BrowserStatus): void {
    this.state.status = status;
  }
}

export default BrowserManager.getInstance();