import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const initMongo = async () => {
  await mongoose.connect(env.mongoUri);
};