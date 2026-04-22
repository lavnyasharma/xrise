import { Response } from 'express';

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res: Response, status: number, message: string, details?: unknown) =>
  res.status(status).json({
    success: false,
    error: details === undefined ? { message } : { message, details },
  });
