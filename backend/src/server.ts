import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config/constants';
import { setupSocketHandlers } from './socket/socketHandler';
import { logger } from './utils/logger';
import BrowserManager from './services/BrowserManager';

const app = express();

app.use(cors({ origin: CONFIG.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: BrowserManager.getMode(),
    browser: BrowserManager.getBrowserStatus().status,
    timestamp: new Date().toISOString(),
  });
});

app.get('/session', (_req, res) => {
  res.json(BrowserManager.getSessionInfo());
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CONFIG.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

setupSocketHandlers(io);

httpServer.listen(CONFIG.PORT, () => {
  logger.info(`Backend running on http://localhost:${CONFIG.PORT}`);
  logger.info(`Mode: ${BrowserManager.getMode()}`);
  logger.info(`Health: http://localhost:${CONFIG.PORT}/health`);
});

export { io };