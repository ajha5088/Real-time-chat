import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  fullName: z.string().min(2).max(120),
  avatarUrl: z.string().url().optional().or(z.literal(''))
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64)
});