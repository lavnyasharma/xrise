import { User } from '../models/User';
import { toPublicUser } from '../models/User';

export const getAgents = async () => {
  const users = await User.find({ role: { $in: ['agent', 'admin'] } }).exec();
  return users.map(u => toPublicUser({ _id: u._id, email: u.email, role: u.role }));
};
