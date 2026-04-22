import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(uri: string = env.MONGO_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
  return conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
