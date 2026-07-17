import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogStore {
  correlationId?: string;
  username?: string;
}

// Thread-local store for request-scoped logger metadata
export const loggerStore = new AsyncLocalStorage<LogStore>();

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format((info) => {
    const store = loggerStore.getStore();
    if (store) {
      if (store.correlationId) {
        info.correlationId = store.correlationId;
      }
      if (store.username) {
        info.username = store.username;
      }
    }
    return info;
  })(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    // In test environment, we keep the console quiet to avoid cluttered test outputs
    silent: process.env.NODE_ENV === 'test',
  }),
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format,
  transports,
});
