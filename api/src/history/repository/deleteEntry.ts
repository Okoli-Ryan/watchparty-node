import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import { isEntry } from '../utils/isEntry.ts';

/** Forgets a room. False when there was nothing to forget. */
export async function deleteEntry(db: Db, userId: string, roomId: string): Promise<boolean> {
  const removed = await db
    .delete(historyEntries)
    .where(isEntry(userId, roomId))
    .returning({ roomId: historyEntries.roomId });
  return removed.length === 1;
}
