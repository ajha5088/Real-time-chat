import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { userRepository } from '../repositories/userRepository.js';
import { graphService } from './graphService.js';
import { ApiError } from '../utils/apiError.js';
import { signAccessToken } from '../utils/jwt.js';

export const authService = {
  register: async ({ email, password, fullName, avatarUrl }) => {
    const existing = await userRepository.findByEmail(email);

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      id: uuid(),
      email,
      passwordHash,
      fullName,
      avatarUrl
    });

    await graphService.ensureUserNode({
      id: user.id,
      fullName: user.full_name,
      email: user.email
    });

    const token = signAccessToken({ sub: user.id, email: user.email });

    return { user, token };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const token = signAccessToken({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        status: user.status,
        created_at: user.created_at
      },
      token
    };
  }
};