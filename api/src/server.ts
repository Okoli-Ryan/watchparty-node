import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { config } from './config.ts';
import { pool, runMigrations } from './db/database.ts';
import { logger } from './logger.ts';
import { attachRealtime } from './realtime/socket.ts';

await runMigrations();

const server = createServer(createApp());
attachRealtime(server);

server.listen(config.port, () => {
  logger.info(`listening on http://localhost:${config.port}`);
});

/** Stop taking requests, let in-flight ones finish, then close the database pool. */
function shutDown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(() => void pool.end());
  server.closeAllConnections();
}

process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));
