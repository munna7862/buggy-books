import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.resolve(__dirname, '../../..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const createLogger = (filename: string, level: string = 'info') => {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp }) =>
        `[${timestamp}] ${level.toUpperCase()}: ${message}`
      )
    ),
    transports: [
      new winston.transports.Console({ format: winston.format.colorize({ all: true }) }),
      new winston.transports.File({ filename: path.join(logDir, filename) })
    ]
  });
};

export const logger = createLogger('framework.log');
export const errorLogger = createLogger('errors.log', 'error');
