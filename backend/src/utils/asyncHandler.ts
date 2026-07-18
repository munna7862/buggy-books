import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps asynchronous Express route handlers to automatically catch
 * thrown errors and forward them to the centralized error middleware.
 *
 * Usage:
 *   router.post('/login', asyncHandler(authController.login));
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
