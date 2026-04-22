import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';
import { TicketPriority, TicketStatus } from '../types';

export interface ITicket {
  name: string;
  email: string;
  subject: string;
  body: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketDoc = HydratedDocument<ITicket>;

const ticketSchema = new Schema<ITicket>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 10_000 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      default: 'open',
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Text index for search across subject + body
ticketSchema.index(
  { subject: 'text', body: 'text' },
  { weights: { subject: 5, body: 1 }, name: 'ticket_text_idx' }
);

// Compound index useful for listing + sorting
ticketSchema.index({ status: 1, createdAt: -1 });

ticketSchema.set('toJSON', {
  virtuals: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Ticket: Model<ITicket> = model<ITicket>('Ticket', ticketSchema);
