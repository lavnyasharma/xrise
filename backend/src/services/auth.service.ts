import { User, toPublicUser } from '../models/User';
import { AuthUser } from '../types';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export const login = async (email: string, password: string): Promise<LoginResult> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password').exec();
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const matches = await comparePassword(password, user.password);
  if (!matches) throw ApiError.unauthorized('Invalid credentials');

  const publicUser = toPublicUser({ _id: user._id, email: user.email, role: user.role });
  const token = signToken(publicUser);
  return { token, user: publicUser };
};
