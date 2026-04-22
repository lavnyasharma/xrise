export type Role = 'agent' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketEventType = 'created' | 'reply' | 'status_change' | 'reassigned';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: { _id: string; email: string; role: Role } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  type: TicketEventType;
  message: string;
  createdBy: { _id: string; email: string; role: Role } | null;
  createdAt: string;
}

export interface PublicTicketStatus {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTickets {
  items: Ticket[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketDetails {
  ticket: Ticket;
  timeline: TicketEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}
