import { NextFunction, Response } from 'express';
import { z } from 'zod';
import * as ticketService from '../services/ticket.service';
import { AuthedRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/response';

// -----------------------------
// Schemas
// -----------------------------

export const createTicketSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const publicStatusSchema = z.object({
  ticketId: z.string().min(1),
  email: z.string().email(),
});

export const listTicketsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

export const replySchema = z.object({
  message: z.string().trim().min(1).max(10_000),
});

export const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
});

export const assignSchema = z.object({
  assigneeId: z.string().min(1),
});

// -----------------------------
// Handlers
// -----------------------------

const requireUser = (req: AuthedRequest) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const create = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body as z.infer<typeof createTicketSchema>;
    const ticket = await ticketService.createTicket(data);
    ok(res, ticket, 201);
  } catch (err) {
    next(err);
  }
};

export const publicStatus = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId, email } = req.body as z.infer<typeof publicStatusSchema>;
    const status = await ticketService.getPublicStatus(ticketId, email);
    ok(res, status);
  } catch (err) {
    next(err);
  }
};

export const list = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const query = req.query as unknown as z.infer<typeof listTicketsSchema>;
    const result = await ticketService.listTickets(user, query);
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const details = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const result = await ticketService.getTicketDetails(user, req.params.id);
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const reply = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { message } = req.body as z.infer<typeof replySchema>;
    const event = await ticketService.addReply(user, req.params.id, message);
    ok(res, event, 201);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { status } = req.body as z.infer<typeof statusSchema>;
    const ticket = await ticketService.changeStatus(user, req.params.id, status);
    ok(res, ticket);
  } catch (err) {
    next(err);
  }
};

export const assign = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { assigneeId } = req.body as z.infer<typeof assignSchema>;
    const ticket = await ticketService.reassignTicket(user, req.params.id, assigneeId);
    ok(res, ticket);
  } catch (err) {
    next(err);
  }
};
