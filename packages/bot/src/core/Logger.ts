import pino from 'pino';
import { config } from '../config/index.js';

const transport =
  config.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

export const logger = pino({
  level: config.LOG_LEVEL,
  transport,
});

