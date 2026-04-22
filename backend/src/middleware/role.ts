import { NextFunction, Response } from 'express';
import { AuthedRequest, Role } from '../types';
import { ApiError } from '../utils/ApiError';

export const requireRole =
  (...roles: Role[]) =>
  (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'));
    return next();
  };
