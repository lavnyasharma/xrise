import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
// Placeholder — actual URI is overwritten by startTestDB below. Env schema needs a non-empty value at load time.
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://placeholder/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.LOG_LEVEL = 'fatal';
process.env.CORS_ORIGINS = '*';
process.env.RATE_LIMIT_MAX = '1000';
process.env.SEED_AGENT_PASSWORD = 'Agent@12345';
process.env.SEED_ADMIN_PASSWORD = 'Admin@12345';

let mongo: MongoMemoryServer | null = null;

export const startTestDB = async (): Promise<void> => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URI);
};

export const stopTestDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

export const clearDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
