import { randomUUID } from 'node:crypto';
import type { Db } from '../../db/database.ts';
import { chatMessages } from '../../db/schema.ts';

/** Stores one encrypted message. Returns its id. */
export async function insertMessage(
  db: Db,
  roomId: string,
  sender: { id: string; displayName: string },
  body: { iv: string; ct: string },
): Promise<string> {
  const id = randomUUID();
  await db.insert(chatMessages).values({
    id,
    roomId,
    senderId: sender.id,
    senderName: sender.displayName,
    iv: body.iv,
    ct: body.ct,
    sentAt: Date.now(),
  });
  return id;
}
