import { NextFunction, Request, Response } from 'express';
import * as userService from '../services/user.service';
import { ok } from '../utils/response';
import { logger } from '../config/logger';

export const getAgents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const agents = await userService.getAgents();
    ok(res, agents);
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'users: getAgents failed');
    next(err);
  }
};
