import { chatMessages } from '../../db/schema.ts';

/**
 * The columns a client receives, under the names it expects. Still encrypted:
 * decryption happens only in the client.
 */
export const messageColumns = {
  id: chatMessages.id,
  roomId: chatMessages.roomId,
  senderUid: chatMessages.senderId,
  senderName: chatMessages.senderName,
  iv: chatMessages.iv,
  ct: chatMessages.ct,
  createdAt: chatMessages.sentAt,
};
