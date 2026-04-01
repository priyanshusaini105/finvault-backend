import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { env } from '@/config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
  }

  // Unexpected errors
  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    code: 'INTERNAL_ERROR',
  });
}
