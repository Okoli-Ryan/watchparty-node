import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { memberships } from '../../db/schema.ts';

/** Refreshes a member's heartbeat. False when they are not in the room. */
export async function recordBeat(db: Db, roomId: string, userId: string): Promise<boolean> {
  const updated = await db
    .update(memberships)
    .set({ lastSeen: Date.now() })
    .where(and(eq(memberships.roomId, roomId), eq(memberships.userId, userId)))
    .returning({ userId: memberships.userId });
  return updated.length === 1;
}
