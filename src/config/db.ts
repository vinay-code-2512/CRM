import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async () => {
  if (!ENV.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(ENV.MONGO_URI);
  console.log('MongoDB connected successfully');
};
