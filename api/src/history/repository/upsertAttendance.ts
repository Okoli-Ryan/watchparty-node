import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import { findRoom } from '../../rooms/repository/findRoom.ts';
import { roomSnapshot } from '../utils/roomSnapshot.ts';

/**
 * "I was here." Creates the entry or refreshes it with the room's current name
 * and page. Keeps an existing favourite flag and read position.
 * False when the room does not exist.
 */
export async function upsertAttendance(db: Db, userId: string, roomId: string): Promise<boolean> {
  const room = await findRoom(db, roomId);
  if (!room) return false;

  const attended = { ...roomSnapshot(room), lastAttendedAt: Date.now() };
  await db
    .insert(historyEntries)
    .values({ userId, roomId, ...attended })
    .onConflictDoUpdate({ target: [historyEntries.userId, historyEntries.roomId], set: attended });
  return true;
}
