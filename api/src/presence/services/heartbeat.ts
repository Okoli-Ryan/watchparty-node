import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { uuidParam } from '../../http/input.ts';
import * as notify from '../../realtime/notify.ts';
import { recordBeat } from '../repository/recordBeat.ts';
import { enterRoom } from './enterRoom.ts';
import { minGap } from '../utils/minGap.ts';
import { reconcileRoom } from './reconcileRoom.ts';

/**
 * Reconcile takes the room lock and reads the whole roster, so with many
 * members beating it runs at most this often per room. It only needs to catch
 * members that have been quiet for STALE_AFTER_MS, which is far longer.
 */
const RECONCILE_GAP_MS = 5_000;
const mayReconcile = minGap(RECONCILE_GAP_MS);

/**
 * Marks the caller as still watching. Most beats are just that one write; the
 * roster push is coalesced and the reconcile is rate-limited per room. A member
 * pruned while their browser slept (a suspended laptop, a recycled service
 * worker) comes back in, rather than heartbeating into nothing forever.
 */
export async function heartbeat(req: Request, res: Response) {
  const userId = callerId(req);
  const roomId = uuidParam(req, 'roomId');

  const stillAMember = await recordBeat(db, roomId, userId);
  if (stillAMember) {
    notify.membersChangedSoon(roomId);
    if (mayReconcile(roomId)) await reconcileRoom(roomId);
  } else {
    await enterRoom(userId, roomId);
    await reconcileRoom(roomId);
  }

  res.status(204).end();
}
