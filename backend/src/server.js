import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initPostgres } from './db/postgres.js';
import { initMongo } from './db/mongo.js';
import { initNeo4j } from './db/neo4j.js';
import { registerSocketHandlers } from './sockets/socketHandlers.js';
import { log } from './config/logger.js';

const bootstrap = async () => {
  await initPostgres();
  await initMongo();
  await initNeo4j();

  const app = createApp();
  const server = createServer(app);

  // Configure Socket.IO CORS
  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175'
  ];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  registerSocketHandlers(io);

  server.listen(env.port, () => {
    log(`Server running on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});