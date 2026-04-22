import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json(data);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json(data);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});