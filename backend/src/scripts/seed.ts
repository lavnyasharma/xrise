import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User } from '../models/User';
import { Ticket } from '../models/Ticket';
import { TicketEvent } from '../models/TicketEvent';
import { hashPassword } from '../utils/password';
import mongoose from 'mongoose';

// ─── Config ────────────────────────────────────────────────────────────────

const FRESH = process.argv.includes('--fresh');

// ─── User fixtures ─────────────────────────────────────────────────────────

const USER_FIXTURES = [
  { email: 'admin@xriseai.com',  password: env.SEED_ADMIN_PASSWORD, role: 'admin' as const },
  { email: 'agent1@xriseai.com', password: env.SEED_AGENT_PASSWORD, role: 'agent' as const },
  { email: 'agent2@xriseai.com', password: env.SEED_AGENT_PASSWORD, role: 'agent' as const },
  { email: 'agent3@xriseai.com', password: env.SEED_AGENT_PASSWORD, role: 'agent' as const },
];

// ─── Ticket fixtures ────────────────────────────────────────────────────────

interface TicketSeed {
  name: string;
  email: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'closed';
  assigneeEmail?: string;
}

const TICKET_FIXTURES: TicketSeed[] = [
  // open + unassigned
  {
    name: 'Alice Martin',
    email: 'alice@example.com',
    subject: 'Cannot log in to my account',
    body: 'I keep getting an "Invalid credentials" error even though I am sure my password is correct. I tried resetting it twice.',
    priority: 'high',
    status: 'open',
  },
  {
    name: 'Bob Chen',
    email: 'bob@example.com',
    subject: 'Payment declined for no reason',
    body: 'My card is valid and has sufficient funds but every checkout attempt fails at the last step.',
    priority: 'high',
    status: 'open',
  },
  {
    name: 'Carol White',
    email: 'carol@example.com',
    subject: 'Export to CSV is broken',
    body: 'Clicking "Export" downloads an empty file. The data is definitely there on screen.',
    priority: 'medium',
    status: 'open',
  },
  {
    name: 'David Osei',
    email: 'david@example.com',
    subject: 'Dark mode setting not saved',
    body: 'Every time I log out and back in, the theme resets to light mode. I have to change it again each session.',
    priority: 'low',
    status: 'open',
  },
  // open + assigned
  {
    name: 'Emma Singh',
    email: 'emma@example.com',
    subject: 'Profile picture upload fails on mobile',
    body: 'On iOS Safari the upload dialog opens but after selecting a photo nothing happens. Works fine on desktop Chrome.',
    priority: 'medium',
    status: 'open',
    assigneeEmail: 'agent1@xriseai.com',
  },
  {
    name: 'Frank Lopez',
    email: 'frank@example.com',
    subject: 'Notification emails going to spam',
    body: 'All emails from your domain land in my Gmail spam folder. I have marked them as "not spam" but they keep ending up there.',
    priority: 'low',
    status: 'open',
    assigneeEmail: 'agent2@xriseai.com',
  },
  // in_progress
  {
    name: 'Grace Kim',
    email: 'grace@example.com',
    subject: 'API rate limit too restrictive',
    body: 'Our integration hits the 30 req/min cap within seconds on peak hours. We need a higher tier or a burst allowance.',
    priority: 'high',
    status: 'in_progress',
    assigneeEmail: 'agent1@xriseai.com',
  },
  {
    name: 'Henry Park',
    email: 'henry@example.com',
    subject: 'Two-factor auth code not arriving',
    body: 'The SMS with the 6-digit code is either very delayed (30+ minutes) or never arrives. I cannot get past the 2FA screen.',
    priority: 'high',
    status: 'in_progress',
    assigneeEmail: 'agent2@xriseai.com',
  },
  {
    name: 'Isabelle Nguyen',
    email: 'isabelle@example.com',
    subject: 'Search returns irrelevant results',
    body: 'Searching for "invoice march" returns tickets from January about unrelated topics. The relevance ranking seems off.',
    priority: 'medium',
    status: 'in_progress',
    assigneeEmail: 'agent3@xriseai.com',
  },
  {
    name: 'James Turner',
    email: 'james@example.com',
    subject: 'Bulk delete removes wrong items',
    body: 'When I select 10 items and hit Delete, it deletes a different set of 10. Reproducible 100% of the time.',
    priority: 'high',
    status: 'in_progress',
    assigneeEmail: 'agent3@xriseai.com',
  },
  // closed
  {
    name: 'Karen Hall',
    email: 'karen@example.com',
    subject: 'Cannot change email address',
    body: 'The account settings page shows no field to update email. Is this intentional?',
    priority: 'medium',
    status: 'closed',
    assigneeEmail: 'agent1@xriseai.com',
  },
  {
    name: 'Leo Fernandez',
    email: 'leo@example.com',
    subject: 'Invoice PDF not rendering correctly',
    body: 'The PDF shows garbled characters for amounts over $1,000. Smaller amounts look fine.',
    priority: 'medium',
    status: 'closed',
    assigneeEmail: 'agent2@xriseai.com',
  },
  {
    name: 'Mia Johnson',
    email: 'mia@example.com',
    subject: 'Wrong timezone displayed on dashboard',
    body: 'All timestamps show UTC regardless of my timezone setting (Eastern). Affects the analytics graphs.',
    priority: 'low',
    status: 'closed',
    assigneeEmail: 'agent3@xriseai.com',
  },
  {
    name: 'Noah Williams',
    email: 'noah@example.com',
    subject: 'Duplicate charges on subscription renewal',
    body: 'My card was charged twice this billing cycle. Transaction IDs: TXN-8821 and TXN-8822.',
    priority: 'high',
    status: 'closed',
    assigneeEmail: 'agent1@xriseai.com',
  },
  {
    name: 'Olivia Brown',
    email: 'olivia@example.com',
    subject: 'Feature request: keyboard shortcut for reply',
    body: 'Would love Ctrl+R or similar to quickly open the reply box. Currently requires 3 mouse clicks.',
    priority: 'low',
    status: 'closed',
    assigneeEmail: 'agent2@xriseai.com',
  },
];

// ─── Event templates ────────────────────────────────────────────────────────

function createdEvent(ticketId: mongoose.Types.ObjectId): object {
  return { ticketId, type: 'created', message: 'Ticket submitted.', createdBy: null };
}

function replyEvent(
  ticketId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
  text: string,
): object {
  return { ticketId, type: 'reply', message: text, createdBy: agentId };
}

function statusEvent(
  ticketId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
  from: string,
  to: string,
): object {
  return {
    ticketId,
    type: 'status_change',
    message: `Status changed from ${from} to ${to}.`,
    createdBy: agentId,
  };
}

function reassignEvent(
  ticketId: mongoose.Types.ObjectId,
  adminId: mongoose.Types.ObjectId,
  toEmail: string,
): object {
  return {
    ticketId,
    type: 'reassigned',
    message: `Ticket reassigned to ${toEmail}.`,
    createdBy: adminId,
  };
}

// ─── Runner ─────────────────────────────────────────────────────────────────

const run = async () => {
  await connectDB();

  if (FRESH) {
    logger.info('seed: --fresh flag detected, clearing existing data');
    await Promise.all([
      User.deleteMany({}),
      Ticket.deleteMany({}),
      TicketEvent.deleteMany({}),
    ]);
  }

  // ── Users ────────────────────────────────────────────────────────────────

  const userIdMap = new Map<string, mongoose.Types.ObjectId>();

  for (const u of USER_FIXTURES) {
    let user = await User.findOne({ email: u.email }).lean().exec();
    if (user) {
      logger.info({ email: u.email }, 'seed: user exists, skipping');
    } else {
      const created = await User.create({
        email: u.email,
        password: await hashPassword(u.password),
        role: u.role,
      });
      user = created.toObject();
      logger.info({ email: u.email, role: u.role }, 'seed: user created');
    }
    userIdMap.set(u.email, user._id as mongoose.Types.ObjectId);
  }

  const adminId = userIdMap.get('admin@xriseai.com')!;

  // ── Tickets + events ─────────────────────────────────────────────────────

  for (const t of TICKET_FIXTURES) {
    const exists = await Ticket.findOne({ email: t.email, subject: t.subject }).lean().exec();
    if (exists) {
      logger.info({ subject: t.subject }, 'seed: ticket exists, skipping');
      continue;
    }

    const assigneeId = t.assigneeEmail ? userIdMap.get(t.assigneeEmail) ?? null : null;

    const ticket = await Ticket.create({
      name: t.name,
      email: t.email,
      subject: t.subject,
      body: t.body,
      priority: t.priority,
      status: t.status,
      assignee: assigneeId,
    });

    const tid = ticket._id as mongoose.Types.ObjectId;
    const events: object[] = [createdEvent(tid)];

    if (assigneeId) {
      events.push(reassignEvent(tid, adminId, t.assigneeEmail!));
      events.push(replyEvent(tid, assigneeId, 'Thanks for reaching out — I am looking into this now.'));
    }

    if (t.status === 'in_progress' && assigneeId) {
      events.push(statusEvent(tid, assigneeId, 'open', 'in_progress'));
    }

    if (t.status === 'closed' && assigneeId) {
      events.push(statusEvent(tid, assigneeId, 'in_progress', 'closed'));
      events.push(replyEvent(tid, assigneeId, 'This has been resolved. Please reopen if the issue persists.'));
    }

    await TicketEvent.insertMany(events);
    logger.info({ subject: t.subject, status: t.status, events: events.length }, 'seed: ticket created');
  }

  await disconnectDB();
  logger.info('Seed complete');
};

run().catch(async (err) => {
  logger.error({ err }, 'Seed failed');
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
