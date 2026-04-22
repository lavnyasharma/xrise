import { buildApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';

const start = async (): Promise<void> => {
  try {
    await connectDB();
    const app = buildApp();

    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening');
    });

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
      // Force exit if graceful shutdown stalls
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
};

void start();
