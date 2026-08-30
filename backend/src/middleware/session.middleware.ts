import { Request, Response, NextFunction } from 'express';
import { sessionStorageContext } from '../data/storage';
import { loggerStore } from '../utils/logger';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const rawSessionId = req.headers['x-test-session-id'];
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim().length > 0
    ? rawSessionId.trim()
    : undefined;

  req.sessionId = sessionId;

  if (sessionId) {
    res.setHeader('x-test-session-id', sessionId);
  }

  const currentLogStore = loggerStore.getStore();
  if (currentLogStore && sessionId) {
    currentLogStore.sessionId = sessionId;
  }

  sessionStorageContext.run({ sessionId }, () => {
    next();
  });
};
