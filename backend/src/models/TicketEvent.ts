import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';
import { TicketEventType } from '../types';

export interface ITicketEvent {
  ticketId: Types.ObjectId;
  type: TicketEventType;
  message: string;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

export type TicketEventDoc = HydratedDocument<ITicketEvent>;

const ticketEventSchema = new Schema<ITicketEvent>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['created', 'reply', 'status_change', 'reassigned'],
      required: true,
    },
    message: { type: String, required: true, maxlength: 10_000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

ticketEventSchema.index({ ticketId: 1, createdAt: 1 });

ticketEventSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const TicketEvent: Model<ITicketEvent> = model<ITicketEvent>(
  'TicketEvent',
  ticketEventSchema
);
