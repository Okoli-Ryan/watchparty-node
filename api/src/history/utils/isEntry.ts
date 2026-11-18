import { and, eq } from 'drizzle-orm';
import { historyEntries } from '../../db/schema.ts';

/** Matches one user's entry for one room. */
export function isEntry(userId: string, roomId: string) {
  return and(eq(historyEntries.userId, userId), eq(historyEntries.roomId, roomId));
}
