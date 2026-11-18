import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { users } from '../../db/schema.ts';
import type { User } from '../types.ts';

export async function findUserById(db: Db, id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}
