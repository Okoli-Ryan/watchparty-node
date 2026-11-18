import { z } from 'zod';

// ---------------------------------------------------------------------------
// Every setting the API reads, checked once at start-up. A missing or weak
// secret stops the process here rather than surfacing as a confusing failure
// on the first sign-in.
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** "a, b ,c" → ["a", "b", "c"] */
const commaSeparatedList = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter((item) => item.length > 0));

const environment = z.object({
  PORT: z.coerce.number().int().positive().default(5080),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/watchparty'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters (see api/.env.example).'),
  CORS_ORIGINS: commaSeparatedList.default(['http://localhost:5174']),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const env = environment.parse(process.env);

export const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    issuer: 'watchparty-api',
    audience: 'watchparty-clients',
    lifetimeMs: SEVEN_DAYS_MS,
  },
  corsOrigins: env.CORS_ORIGINS,
  trustProxy: env.TRUST_PROXY,
  logLevel: env.LOG_LEVEL,
};
