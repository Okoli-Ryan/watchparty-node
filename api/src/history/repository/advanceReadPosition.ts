import { isNull, lt, or } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import type { Room } from '../../rooms/types.ts';
import { roomSnapshot } from '../utils/roomSnapshot.ts';

/**
 * Advances the read position, creating the entry if needed. It only ever moves
 * forward: a client that is behind must never un-read what another client has
 * already read. Returns true when the position moved.
 */
export async function advanceReadPosition(db: Db, userId: string, room: Room, at: number): Promise<boolean> {
  const moved = await db
    .insert(historyEntries)
    .values({ userId, roomId: room.id, ...roomSnapshot(room), lastReadAt: at })
    .onConflictDoUpdate({
      target: [historyEntries.userId, historyEntries.roomId],
      set: { lastReadAt: at },
      setWhere: or(isNull(historyEntries.lastReadAt), lt(historyEntries.lastReadAt, at)),
    })
    .returning({ roomId: historyEntries.roomId });
  return moved.length === 1;
}
