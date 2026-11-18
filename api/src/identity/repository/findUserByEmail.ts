import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { users } from '../../db/schema.ts';
import type { User } from '../types.ts';

/** `email` must already be trimmed and lower-cased, as it is stored. */
export async function findUserByEmail(db: Db, email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}
