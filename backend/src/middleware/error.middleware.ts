import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Centralized error handling middleware.
 * Parses validation errors, custom application errors, and general system exceptions.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = res.getHeader('x-correlation-id') as string || undefined;
  
  let statusCode = 500;
  let errorName = 'InternalServerError';
  let message = 'Something went wrong';
  let details: any = undefined;

  // Handle custom AppError hierarchy
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorName = err.constructor.name;
    message = err.message;
    details = err.details;
  }
  // Handle Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorName = 'ValidationError';
    message = 'Validation failed';
    details = err.issues;
  }
  // Handle native Multer errors
  else if (err?.name === 'MulterError') {
    statusCode = 400;
    errorName = 'ValidationError';
    message = err.message;
  }
  // Handle general standard Errors
  else if (err instanceof Error) {
    errorName = err.name || errorName;
    if ('status' in err) {
      statusCode = (err as any).status;
    }
    // Standard unhandled/body-parser errors default to 'Internal Server Error'
    message = 'Internal Server Error';
  }

  // Log error (exclude validation errors/404s from error-level noise)
  const isServerSideError = statusCode >= 500;
  const logPayload = {
    error: errorName,
    statusCode,
    url: req.originalUrl,
    correlationId,
    stack: !config.isProduction ? err.stack : undefined,
    details
  };

  if (isServerSideError) {
    logger.error(`Server Error: ${message}`, logPayload);
  } else {
    logger.warn(`Client Request Warning: ${message}`, logPayload);
  }

  // Return clean structured error payload
  res.status(statusCode).json({
    error: message,
    errorName,
    correlationId,
    ...(details ? { details } : {}),
    ...(!config.isProduction && isServerSideError ? { stack: err.stack } : {})
  });
};
