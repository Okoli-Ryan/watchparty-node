import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { UserErrors } from '../../http/errors.ts';
import { bodyOf } from '../../http/input.ts';
import { findUserById } from '../../identity/repository/findUserById.ts';
import * as notify from '../../realtime/notify.ts';
import { insertRoom } from '../repository/insertRoom.ts';
import type { ChatProtection } from '../types.ts';
import { base64, CHAT_KEY_MESSAGE, encryptedText, MAX_KEY_MATERIAL_LENGTH, roomName, videoFields } from '../utils/schemas.ts';

/** Absent, null or empty: what a room sends for key material it must not carry. */
const nothing = z.union([z.literal(''), z.null(), z.undefined()], CHAT_KEY_MESSAGE);
const keyMaterial = base64(MAX_KEY_MATERIAL_LENGTH, CHAT_KEY_MESSAGE);
const newRoomFields = z.object({ name: roomName, ...videoFields });

/**
 * How the chat key is held (DECISIONS.md #13).
 *  public  — a random key, stored with the room.
 *  private — the key is derived from a passphrase that never leaves the client;
 *            only the salt and a verifier are stored, never a key.
 */
export const createRoomBody = z.discriminatedUnion(
  'visibility',
  [
    newRoomFields.extend({ visibility: z.literal('public'), chatKey: keyMaterial, chatSalt: nothing, chatCheck: nothing }),
    newRoomFields.extend({ visibility: z.literal('private'), chatKey: nothing, chatSalt: keyMaterial, chatCheck: encryptedText }),
  ],
  'Visibility must be "public" or "private".',
);

/** Keeps only the key material the room's visibility allows. */
function chatProtectionOf(body: z.infer<typeof createRoomBody>): ChatProtection {
  if (body.visibility === 'public') {
    return { visibility: 'public', chatKey: body.chatKey, chatSalt: '', chatCheck: null };
  }
  return { visibility: 'private', chatKey: '', chatSalt: body.chatSalt, chatCheck: body.chatCheck };
}

/** Creates a room hosted by the caller. Key material is prepared by the client. */
export async function createRoom(req: Request, res: Response) {
  const body = createRoomBody.parse(bodyOf(req));
  const owner = await findUserById(db, callerId(req));
  if (!owner) throw UserErrors.notFound();

  const roomId = await insertRoom(db, {
    name: body.name,
    video: { pageUrl: body.pageUrl, selector: body.selector, frameOrigin: body.frameOrigin },
    chat: chatProtectionOf(body),
    owner,
    currentTime: body.currentTime,
  });

  notify.roomChanged(roomId);
  res.status(201).location(`/api/v1/rooms/${roomId}`).json({ id: roomId });
}
