import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import * as authService from '../services/auth.service';
import { ok } from '../utils/response';

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const result = await authService.login(email, password);
    ok(res, result);
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'auth: login failed');
    next(err);
  }
};
