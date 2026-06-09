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
} as const;