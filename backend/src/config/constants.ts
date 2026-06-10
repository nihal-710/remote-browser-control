import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  SCREENSHOT_INTERVAL: parseInt(process.env.SCREENSHOT_INTERVAL || '500', 10),
  BROWSER: {
    WIDTH: parseInt(process.env.BROWSER_WIDTH || '1280', 10),
    HEIGHT: parseInt(process.env.BROWSER_HEIGHT || '720', 10),
    DEFAULT_URL: 'https://www.google.com',
  },
  CDP_URL: process.env.CDP_URL || 'http://localhost:9222',
  USE_DOCKER: process.env.USE_DOCKER === 'true',
} as const;