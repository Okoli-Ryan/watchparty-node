import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { uuidParam } from '../../http/input.ts';
import * as notify from '../../realtime/notify.ts';
import { removeMembers } from '../repository/removeMembers.ts';
import { reconcileRoom } from './reconcileRoom.ts';

/**
 * Removes the caller from a room. Idempotent. Reconciles even when there was
 * nothing to remove: if the host just left, the next person takes over now
 * instead of after the heartbeat grace period.
 */
export async function leaveRoom(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');

  const removed = await removeMembers(db, roomId, [callerId(req)]);
  if (removed > 0) notify.membersChanged(roomId);

  await reconcileRoom(roomId);
  res.status(204).end();
}
