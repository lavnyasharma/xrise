import { FilterQuery, Types } from 'mongoose';
import { Ticket, ITicket } from '../models/Ticket';
import { TicketEvent } from '../models/TicketEvent';
import { User } from '../models/User';
import { AuthUser, TicketPriority, TicketStatus } from '../types';
import { ApiError } from '../utils/ApiError';

export interface CreateTicketInput {
  name: string;
  email: string;
  subject: string;
  body: string;
  priority?: TicketPriority;
}

export interface ListTicketsInput {
  page: number;
  limit: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  search?: string;
}

const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');
  return new Types.ObjectId(id);
};

export const createTicket = async (input: CreateTicketInput) => {
  const ticket = await Ticket.create({
    name: input.name,
    email: input.email.toLowerCase(),
    subject: input.subject,
    body: input.body,
    priority: input.priority ?? 'medium',
    status: 'open',
    assignee: null,
  });

  await TicketEvent.create({
    ticketId: ticket._id,
    type: 'created',
    message: `Ticket created by ${input.name} <${input.email.toLowerCase()}>`,
    createdBy: null,
  });

  return ticket.toJSON();
};

export const getPublicStatus = async (ticketId: string, email: string) => {
  if (!Types.ObjectId.isValid(ticketId)) throw ApiError.notFound('Ticket not found');

  const ticket = await Ticket.findOne({
    _id: ticketId,
    email: email.toLowerCase(),
  })
    .select('_id subject status priority createdAt updatedAt')
    .lean()
    .exec();

  if (!ticket) throw ApiError.notFound('Ticket not found');

  return {
    id: String(ticket._id),
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
};

export const listTickets = async (user: AuthUser, input: ListTicketsInput) => {
  const { page, limit, status, priority, assignee, search } = input;

  const filter: FilterQuery<ITicket> = {};

  if (user.role === 'agent') {
    // Agents only see tickets assigned to them — ignore any assignee filter passed in.
    filter.assignee = new Types.ObjectId(user.id);
  } else if (assignee) {
    filter.assignee = assignee === 'unassigned' ? null : toObjectId(assignee);
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  let projection: Record<string, unknown> | undefined;
  let sort: Record<string, 1 | -1 | { $meta: 'textScore' }> = { createdAt: -1 };

  if (search && search.trim().length > 0) {
    filter.$text = { $search: search.trim() };
    projection = { score: { $meta: 'textScore' } };
    sort = { score: { $meta: 'textScore' }, createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Ticket.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignee', 'email role')
      .lean()
      .exec(),
    Ticket.countDocuments(filter).exec(),
  ]);

  return {
    items: items.map((t) => ({ ...t, id: String(t._id) })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const ensureAccess = (user: AuthUser, ticket: Pick<ITicket, 'assignee'>) => {
  if (user.role === 'admin') return;
  
  let assigneeId: string | null = null;
  if (ticket.assignee) {
    if (typeof ticket.assignee === 'object' && '_id' in ticket.assignee) {
      assigneeId = String((ticket.assignee as any)._id);
    } else {
      assigneeId = String(ticket.assignee);
    }
  }

  if (assigneeId !== user.id) throw ApiError.forbidden('Not assigned to this ticket');
};

export const getTicketDetails = async (user: AuthUser, ticketId: string) => {
  const id = toObjectId(ticketId);

  const ticket = await Ticket.findById(id).populate('assignee', 'email role').lean().exec();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ensureAccess(user, ticket);

  const timeline = await TicketEvent.find({ ticketId: id })
    .sort({ createdAt: 1 })
    .populate('createdBy', 'email role')
    .lean()
    .exec();

  return {
    ticket: { ...ticket, id: String(ticket._id) },
    timeline: timeline.map((e) => ({ ...e, id: String(e._id) })),
  };
};

export const addReply = async (user: AuthUser, ticketId: string, message: string) => {
  const id = toObjectId(ticketId);
  const ticket = await Ticket.findById(id).select('assignee').lean().exec();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ensureAccess(user, ticket);

  const event = await TicketEvent.create({
    ticketId: id,
    type: 'reply',
    message,
    createdBy: new Types.ObjectId(user.id),
  });

  return event.toJSON();
};

export const changeStatus = async (
  user: AuthUser,
  ticketId: string,
  status: TicketStatus
) => {
  const id = toObjectId(ticketId);
  const ticket = await Ticket.findById(id).exec();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ensureAccess(user, ticket);

  if (ticket.status === status) {
    return ticket.toJSON();
  }

  const previous = ticket.status;
  ticket.status = status;
  await ticket.save();

  await TicketEvent.create({
    ticketId: id,
    type: 'status_change',
    message: `Status changed from ${previous} to ${status}`,
    createdBy: new Types.ObjectId(user.id),
  });

  return ticket.toJSON();
};

export const reassignTicket = async (
  user: AuthUser,
  ticketId: string,
  assigneeId: string
) => {
  if (user.role !== 'admin') throw ApiError.forbidden('Only admin can reassign tickets');

  const id = toObjectId(ticketId);
  const assigneeObjectId = toObjectId(assigneeId);

  const assignee = await User.findById(assigneeObjectId).select('_id email role').lean().exec();
  if (!assignee) throw ApiError.badRequest('Assignee not found');
  if (assignee.role !== 'agent' && assignee.role !== 'admin') {
    throw ApiError.badRequest('Assignee must be an agent or admin');
  }

  const ticket = await Ticket.findById(id).exec();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  let previous = 'unassigned';
  if (ticket.assignee) {
    const prevUser = await User.findById(ticket.assignee).select('email').lean().exec();
    previous = prevUser ? prevUser.email : String(ticket.assignee);
  }

  ticket.assignee = assigneeObjectId;
  await ticket.save();

  await TicketEvent.create({
    ticketId: id,
    type: 'reassigned',
    message: `Ticket reassigned from ${previous} to ${assignee.email}`,
    createdBy: new Types.ObjectId(user.id),
  });

  return ticket.toJSON();
};
