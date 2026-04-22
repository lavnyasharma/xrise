import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';
import { Role } from '../types';

export interface IUser {
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDoc = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['agent', 'admin'], required: true },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> = model<IUser>('User', userSchema);

export const toPublicUser = (u: { _id: Types.ObjectId | string; email: string; role: Role }) => ({
  id: String(u._id),
  email: u.email,
  role: u.role,
});
