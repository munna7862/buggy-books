/**
 * Custom application error classes for the backend.
 *
 * These classes allow throwing semantically meaningful errors from anywhere
 * (services, controllers, database layers) and having them captured globally
 * to return correct HTTP status codes and payloads.
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details?: unknown) {
    super(400, message, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details?: unknown) {
    super(400, message, 'VALIDATION_FAILED', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(404, message, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, message, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR') {
    super(500, message, code);
  }
}
