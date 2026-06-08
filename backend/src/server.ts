import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config/constants';
import { setupSocketHandlers } from './socket/socketHandler';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: CONFIG.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/session', (_req, res) => {
  const BrowserManager = require('./services/BrowserManager').default;
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
  logger.info(`Backend server running on http://localhost:${CONFIG.PORT}`);
  logger.info(`Socket.io ready`);
  logger.info(`Health check: http://localhost:${CONFIG.PORT}/health`);
});

export { io };