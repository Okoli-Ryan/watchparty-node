import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { RoomErrors } from '../../http/errors.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import * as notify from '../../realtime/notify.ts';
import { findRoom } from '../../rooms/repository/findRoom.ts';
import { advanceReadPosition } from '../repository/advanceReadPosition.ts';

const READ_POSITION_MESSAGE = 'The read position must be a non-negative epoch time in milliseconds.';

const readPositionBody = z.object({
  at: z.number(READ_POSITION_MESSAGE).int(READ_POSITION_MESSAGE).min(0, READ_POSITION_MESSAGE),
});

/**
 * Records how far the caller has read a room's chat. Creates the entry if
 * needed: the web dashboard records read position for rooms it only observes.
 */
export async function markRead(req: Request, res: Response) {
  const userId = callerId(req);
  const roomId = uuidParam(req, 'roomId');
  const { at } = readPositionBody.parse(bodyOf(req));

  const room = await findRoom(db, roomId);
  if (!room) throw RoomErrors.notFound();

  const moved = await advanceReadPosition(db, userId, room, at);
  if (moved) notify.historyChanged(userId, roomId);
  res.status(204).end();
}
