import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/userRepository.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
};