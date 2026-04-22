import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { fail } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isApiError = err instanceof ApiError || (err && (err as any).name === 'ApiError');
  if (isApiError) {
    const apiErr = err as ApiError;
    if (apiErr.statusCode >= 500) {
      logger.error({ err: apiErr, path: req.path }, 'ApiError (5xx)');
    } else {
      logger.warn({ msg: apiErr.message, path: req.path, status: apiErr.statusCode }, 'ApiError');
    }
    fail(res, apiErr.statusCode, apiErr.message, apiErr.details);
    return;
  }

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).map(([path, e]) => ({
      path,
      message: (e as mongoose.Error.ValidatorError).message,
    }));
    fail(res, 400, 'Validation failed', details);
    return;
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    fail(res, 400, `Invalid value for field '${err.path}'`);
    return;
  }

  // Duplicate key
  if ((err as { code?: number }).code === 11000) {
    fail(res, 409, 'Duplicate key');
    return;
  }

  logger.error({ err }, 'Unhandled error');
  fail(res, 500, err instanceof Error ? err.message : 'Internal server error', { stack: err instanceof Error ? err.stack : undefined });
};
