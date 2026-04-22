import { Request } from 'express';
import { Types } from 'mongoose';

export type Role = 'agent' | 'admin';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high';

export type TicketEventType = 'created' | 'reply' | 'status_change' | 'reassigned';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export const isObjectId = (v: unknown): v is string =>
  typeof v === 'string' && Types.ObjectId.isValid(v);
