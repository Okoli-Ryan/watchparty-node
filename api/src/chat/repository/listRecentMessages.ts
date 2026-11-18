import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { chatMessages } from '../../db/schema.ts';
import { messageColumns } from '../utils/messageColumns.ts';

/** The newest `limit` messages, returned oldest first for reading. */
export async function listRecentMessages(db: Db, roomId: string, limit: number) {
  const newestFirst = await db
    .select(messageColumns)
    .from(chatMessages)
    .where(eq(chatMessages.roomId, roomId))
    .orderBy(desc(chatMessages.sentAt), desc(chatMessages.id))
    .limit(limit);
  // Newest first to apply the limit; oldest first for reading.
  return newestFirst.reverse();
}
