import { randomUUID } from 'node:crypto';
import type { Db } from '../../db/database.ts';
import { users } from '../../db/schema.ts';
import type { User } from '../types.ts';

/** Inserts an ordinary user. Throws a unique violation if the e-mail is taken. */
export async function insertUser(db: Db, email: string, displayName: string, passwordHash: string): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ id: randomUUID(), email, displayName, role: 'user', passwordHash, createdAt: Date.now() })
    .returning();
  return user;
}
