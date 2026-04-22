import { NextFunction, Response } from 'express';
import { logger } from '../config/logger';
import * as aiService from '../services/ai.service';
import * as ticketService from '../services/ticket.service';
import { AuthedRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/response';

const requireUser = (req: AuthedRequest) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const draftReply = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { ticketId } = req.params;

    const { ticket, timeline } = await ticketService.getTicketDetails(user, ticketId);

    const draft = await aiService.draftReply(
      {
        subject: ticket.subject,
        body: ticket.body,
        name: ticket.name,
        email: ticket.email,
        priority: ticket.priority,
        status: ticket.status,
      },
      timeline.map((e) => ({
        type: e.type,
        message: e.message,
        createdBy: e.createdBy as { email: string; role: string } | null,
      }))
    );

    ok(res, { draft });
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'ai: draftReply handler failed');
    next(err);
  }
};

export const summarise = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { ticketId } = req.params;

    const { ticket, timeline } = await ticketService.getTicketDetails(user, ticketId);

    const result = await aiService.summariseTicket(
      {
        subject: ticket.subject,
        body: ticket.body,
        name: ticket.name,
        email: ticket.email,
        priority: ticket.priority,
        status: ticket.status,
      },
      timeline.map((e) => ({
        type: e.type,
        message: e.message,
        createdBy: e.createdBy as { email: string; role: string } | null,
      }))
    );

    ok(res, result);
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'ai: summarise handler failed');
    next(err);
  }
};
