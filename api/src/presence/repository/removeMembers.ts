import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { memberships } from '../../db/schema.ts';

/** Removes members from a room. Returns how many were actually removed. */
export async function removeMembers(db: Db, roomId: string, userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0;
  const removed = await db
    .delete(memberships)
    .where(and(eq(memberships.roomId, roomId), inArray(memberships.userId, userIds)))
    .returning({ userId: memberships.userId });
  return removed.length;
}
