import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '../config.ts';

/** Headers for a JSON API that is never framed and never renders HTML. */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
});

/**
 * Browser pages (the web dashboard) may call the API only from the configured
 * origins. Bearer tokens, not cookies: credentials are never allowed, so no
 * origin can ride someone else's session.
 */
export const corsOptions: cors.CorsOptions = {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: false,
};

export const corsPolicy = cors(corsOptions);

/** Password guessing: a handful of sign-in or sign-up attempts per minute per address. */
export const signInRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/**
 * Everything else, per signed-in user. A watching client makes about
 * 6 heartbeats and 7 room touches a minute, plus a burst of playback writes
 * while the host scrubs.
 *
 * shortcut: a fixed one-minute window, not a token bucket, so a burst right at
 * a window edge can briefly get double; switch to a bucket if abuse shows up.
 */
export const perUserRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Runs after requireAuth, so the caller is always known.
  keyGenerator: (req) => req.userId ?? 'anonymous',
});
