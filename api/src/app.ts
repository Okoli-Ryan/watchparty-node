import express, { Router, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import { chatRoutes } from './chat/routes.ts';
import { config } from './config.ts';
import { pool } from './db/database.ts';
import { historyRoutes } from './history/routes.ts';
import { requireAuth } from './http/auth.ts';
import { problemHandler, routeNotFound } from './http/problem.ts';
import { corsPolicy, perUserRateLimit, securityHeaders } from './http/security.ts';
import { identityRoutes, publicIdentityRoutes } from './identity/routes.ts';
import { logger } from './logger.ts';
import { presenceRoutes } from './presence/routes.ts';
import { roomRoutes } from './rooms/routes.ts';

/** Liveness: the process is serving requests. No database access. */
function live(_req: Request, res: Response) {
  res.type('text/plain').send('Healthy');
}

/** Readiness: the database answers too. */
async function ready(_req: Request, res: Response) {
  try {
    await pool.query('SELECT 1');
    res.type('text/plain').send('Healthy');
  } catch {
    res.status(503).type('text/plain').send('Unhealthy');
  }
}

/** Everything under /api/v1. Sign-in and sign-up are public; the rest needs a token. */
function buildApiRouter(): Router {
  const api = Router();
  api.use(publicIdentityRoutes);

  api.use(requireAuth, perUserRateLimit);
  api.use(identityRoutes);
  api.use(roomRoutes);
  api.use(presenceRoutes);
  api.use(chatRoutes);
  api.use(historyRoutes);
  return api;
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // One short log line per request. Headers are left out on purpose: they carry
  // bearer tokens. Health probes would only be noise.
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(express.json({ limit: '64kb' }));

  app.get('/health/live', live);
  app.get('/health/ready', ready);
  // Cheap uptime-monitor probe.
  app.head('/', (_req, res) => {
    res.status(200).end();
  });

  app.use('/api/v1', buildApiRouter());

  app.use(routeNotFound);
  app.use(problemHandler);
  return app;
}
