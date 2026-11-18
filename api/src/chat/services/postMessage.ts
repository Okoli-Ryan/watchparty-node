import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { RoomErrors, UserErrors } from '../../http/errors.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import { findUserById } from '../../identity/repository/findUserById.ts';
import * as notify from '../../realtime/notify.ts';
import { findRoom } from '../../rooms/repository/findRoom.ts';
import { encryptedText } from '../../rooms/utils/schemas.ts';
import { insertMessage } from '../repository/insertMessage.ts';

/**
 * Posts an encrypted message. Chat stays open after a room ends, so posting
 * needs only that the room exists.
 */
export async function postMessage(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');
  const message = encryptedText.parse(bodyOf(req));

  if (!(await findRoom(db, roomId))) throw RoomErrors.notFound();

  // The sender is whoever the token says, never a name the client supplies.
  const sender = await findUserById(db, callerId(req));
  if (!sender) throw UserErrors.notFound();

  const messageId = await insertMessage(db, roomId, sender, message);
  notify.messagePosted(roomId, messageId);
  res.status(201).location(`/api/v1/rooms/${roomId}/messages/${messageId}`).json({ id: messageId });
}
