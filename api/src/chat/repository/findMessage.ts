import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { chatMessages } from '../../db/schema.ts';
import { messageColumns } from '../utils/messageColumns.ts';

export async function findMessage(db: Db, messageId: string) {
  const [message] = await db.select(messageColumns).from(chatMessages).where(eq(chatMessages.id, messageId));
  return message ?? null;
}
