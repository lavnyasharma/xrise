import { NextFunction, Response } from 'express';
import { logger } from '../config/logger';
import { AuthedRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const header = req.header('authorization') || req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, 'auth: missing bearer token');
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    logger.warn({ err: (err as Error).message, path: req.path }, 'auth: invalid token');
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};
