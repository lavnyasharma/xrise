import { Express } from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Ticket } from '../src/models/Ticket';
import { TicketEvent } from '../src/models/TicketEvent';
import { Role, TicketPriority, TicketStatus, TicketEventType } from '../src/types';
import { hashPassword } from '../src/utils/password';

// ─── User helpers ────────────────────────────────────────────────────────────

export interface SeededUser {
  id: string;
  email: string;
  role: Role;
  password: string;
}

export const seedUser = async (
  email: string,
  role: Role,
  password = 'Passw0rd!',
): Promise<SeededUser> => {
  const user = await User.create({
    email,
    password: await hashPassword(password),
    role,
  });
  return { id: String(user._id), email, role, password };
};

export const loginAs = async (app: Express, email: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token as string;
};

// ─── Ticket helpers ──────────────────────────────────────────────────────────

export interface TicketOverrides {
  name?: string;
  email?: string;
  subject?: string;
  body?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignee?: string | mongoose.Types.ObjectId | null;
}

export interface SeededTicket {
  id: string;
  email: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string | null;
}

let ticketCounter = 0;

export const seedTicket = async (overrides: TicketOverrides = {}): Promise<SeededTicket> => {
  const n = ++ticketCounter;
  const ticket = await Ticket.create({
    name: overrides.name ?? `Customer ${n}`,
    email: overrides.email ?? `customer${n}@example.com`,
    subject: overrides.subject ?? `Test ticket ${n}`,
    body: overrides.body ?? `Description for test ticket ${n}.`,
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'open',
    assignee: overrides.assignee ?? null,
  });

  return {
    id: String(ticket._id),
    email: ticket.email,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    assignee: ticket.assignee ? String(ticket.assignee) : null,
  };
};

// ─── TicketEvent helpers ─────────────────────────────────────────────────────

export interface EventOverrides {
  type?: TicketEventType;
  message?: string;
  createdBy?: string | mongoose.Types.ObjectId | null;
}

export interface SeededEvent {
  id: string;
  ticketId: string;
  type: TicketEventType;
}

export const seedTicketEvent = async (
  ticketId: string,
  overrides: EventOverrides = {},
): Promise<SeededEvent> => {
  const event = await TicketEvent.create({
    ticketId: new mongoose.Types.ObjectId(ticketId),
    type: overrides.type ?? 'created',
    message: overrides.message ?? 'Ticket submitted.',
    createdBy: overrides.createdBy ?? null,
  });

  return { id: String(event._id), ticketId, type: event.type };
};

// ─── Scenario helper ─────────────────────────────────────────────────────────

/**
 * Seeds a complete, realistic scenario with admin + agents + tickets across all
 * statuses and priorities.  Returns all created objects so tests can reference
 * them directly without extra DB queries.
 */
export interface SeedScenario {
  admin: SeededUser;
  agents: SeededUser[];
  tickets: {
    open: SeededTicket[];
    inProgress: SeededTicket[];
    closed: SeededTicket[];
    unassigned: SeededTicket[];
  };
}

export const seedScenario = async (): Promise<SeedScenario> => {
  const admin = await seedUser('admin@test.com', 'admin', 'Admin@12345');
  const agent1 = await seedUser('agent1@test.com', 'agent', 'Agent@12345');
  const agent2 = await seedUser('agent2@test.com', 'agent', 'Agent@12345');

  // unassigned open tickets
  const unassigned1 = await seedTicket({ email: 'u1@test.com', subject: 'Unassigned high', priority: 'high', status: 'open' });
  const unassigned2 = await seedTicket({ email: 'u2@test.com', subject: 'Unassigned low',  priority: 'low',  status: 'open' });

  // open + assigned
  const open1 = await seedTicket({ email: 'o1@test.com', subject: 'Open medium', priority: 'medium', status: 'open', assignee: agent1.id });
  const open2 = await seedTicket({ email: 'o2@test.com', subject: 'Open high',   priority: 'high',   status: 'open', assignee: agent2.id });

  // in_progress
  const ip1 = await seedTicket({ email: 'ip1@test.com', subject: 'In progress high',   priority: 'high',   status: 'in_progress', assignee: agent1.id });
  const ip2 = await seedTicket({ email: 'ip2@test.com', subject: 'In progress medium', priority: 'medium', status: 'in_progress', assignee: agent2.id });

  // closed
  const closed1 = await seedTicket({ email: 'c1@test.com', subject: 'Closed low',    priority: 'low',    status: 'closed', assignee: agent1.id });
  const closed2 = await seedTicket({ email: 'c2@test.com', subject: 'Closed medium', priority: 'medium', status: 'closed', assignee: agent2.id });

  // seed basic events for each ticket
  const allTickets = [unassigned1, unassigned2, open1, open2, ip1, ip2, closed1, closed2];
  await Promise.all(allTickets.map((t) => seedTicketEvent(t.id, { type: 'created' })));

  // additional events for in_progress + closed
  for (const t of [ip1, ip2]) {
    await seedTicketEvent(t.id, { type: 'status_change', message: 'Status changed from open to in_progress.', createdBy: t.assignee });
  }
  for (const t of [closed1, closed2]) {
    await seedTicketEvent(t.id, { type: 'status_change', message: 'Status changed from in_progress to closed.', createdBy: t.assignee });
  }

  return {
    admin,
    agents: [agent1, agent2],
    tickets: {
      open: [open1, open2],
      inProgress: [ip1, ip2],
      closed: [closed1, closed2],
      unassigned: [unassigned1, unassigned2],
    },
  };
};
