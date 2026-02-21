import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized error handling middleware
 * Handles different types of errors and returns appropriate HTTP responses
 */
export const errorHandler = (
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      message: 'Validation error',
      errors,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Custom application errors with status codes
  if ('statusCode' in err && err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message || 'An error occurred',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
    });
  }

  // Default to 500 Internal Server Error
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
