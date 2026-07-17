import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { loggerStore } from '../utils/logger';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Retrieve incoming correlation ID or generate a new UUID
  const correlationId = (
    req.headers['x-correlation-id'] || 
    req.headers['x-request-id'] || 
    crypto.randomUUID()
  ) as string;

  // Expose the correlation ID to the response header
  res.setHeader('x-correlation-id', correlationId);

  // Wrap the request lifetime inside AsyncLocalStorage
  loggerStore.run({ correlationId }, () => {
    next();
  });
};
