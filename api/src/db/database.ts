import { fileURLToPath } from 'node:url';
import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import pg from 'pg';
import { config } from '../config.ts';
import * as schema from './schema.ts';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });

/**
 * Either the database or a transaction: both run the same queries, so store
 * functions take this and work inside or outside a transaction.
 */
export type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;

/** Postgres error code for a unique or primary-key violation. */
export const UNIQUE_VIOLATION = '23505';

/** True when `error` is Postgres refusing a duplicate (wrapped by Drizzle or not). */
export function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === UNIQUE_VIOLATION;
}

/** Applies any migrations in api/drizzle/ that have not run yet. */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
  await migrate(db, { migrationsFolder });
}
