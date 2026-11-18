import { asc, eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { memberships } from '../../db/schema.ts';
import type { Member } from '../types.ts';

/** Everyone in the room, in join order. */
export async function listMembers(db: Db, roomId: string): Promise<Member[]> {
  return db.select().from(memberships).where(eq(memberships.roomId, roomId)).orderBy(asc(memberships.joinedAt));
}
