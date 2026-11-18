import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import { isEntry } from '../utils/isEntry.ts';

/** Stars or unstars a room. False when it is not in the user's history. */
export async function updateFavourite(db: Db, userId: string, roomId: string, favourite: boolean): Promise<boolean> {
  const updated = await db
    .update(historyEntries)
    .set({ isFavourite: favourite })
    .where(isEntry(userId, roomId))
    .returning({ roomId: historyEntries.roomId });
  return updated.length === 1;
}
