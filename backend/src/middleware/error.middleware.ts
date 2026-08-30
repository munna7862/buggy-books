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
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const correlationId = (res.getHeader('x-correlation-id') as string) || undefined;
  
  let statusCode = 500;
  let errorName = 'InternalServerError';
  let message = 'Something went wrong';
  let details: unknown = undefined;
  const stack = err instanceof Error ? err.stack : undefined;

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
  else if (typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'MulterError') {
    statusCode = 400;
    errorName = 'ValidationError';
    message = 'message' in err && typeof (err as { message: unknown }).message === 'string' ? (err as { message: string }).message : 'File upload error';
  }
  // Handle general standard Errors
  else if (err instanceof Error) {
    errorName = err.name || errorName;
    if ('status' in err && typeof (err as { status: unknown }).status === 'number') {
      statusCode = (err as { status: number }).status;
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
    stack: !config.isProduction ? stack : undefined,
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
    ...(!config.isProduction && isServerSideError && stack ? { stack } : {})
  });
};
