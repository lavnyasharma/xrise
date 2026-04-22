import { api, unwrap } from './axios';
import {
  Ticket,
  TicketDetails,
  TicketEvent,
  PaginatedTickets,
  PublicTicketStatus,
  TicketStatus,
} from '@/types';

export interface CreateTicketInput {
  name: string;
  email: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  priority?: 'low' | 'medium' | 'high' | '';
  assignee?: string;
  search?: string;
}

export const createTicket = (input: CreateTicketInput) =>
  api.post('/tickets', input).then(unwrap<Ticket>);

export const getPublicStatus = (ticketId: string, email: string) =>
  api.post('/tickets/status', { ticketId, email }).then(unwrap<PublicTicketStatus>);

export const listTickets = (params: ListTicketsParams = {}) => {
  // Strip empty strings so the backend doesn't receive invalid enums
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
  );
  return api.get('/tickets', { params: clean }).then(unwrap<PaginatedTickets>);
};

export const getTicketDetails = (id: string) =>
  api.get(`/tickets/${id}`).then(unwrap<TicketDetails>);

export const addReply = (id: string, message: string) =>
  api.post(`/tickets/${id}/reply`, { message }).then(unwrap<TicketEvent>);

export const updateTicketStatus = (id: string, status: TicketStatus) =>
  api.patch(`/tickets/${id}/status`, { status }).then(unwrap<Ticket>);

export const assignTicket = (id: string, assigneeId: string) =>
  api.patch(`/tickets/${id}/assign`, { assigneeId }).then(unwrap<Ticket>);
