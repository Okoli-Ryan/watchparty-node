import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { RoomErrors } from '../../http/errors.ts';
import { bodyOf, uuid, uuidParam } from '../../http/input.ts';
import { findMember } from '../../presence/repository/findMember.ts';
import { isPresent } from '../../presence/utils/succession.ts';
import * as notify from '../../realtime/notify.ts';
import { updateOwner } from '../repository/updateOwner.ts';
import { changeRoomAsHost } from './changeRoomAsHost.ts';

const transferBody = z.object({ targetUid: uuid });

/**
 * Host only: deliberately hands the room to someone watching right now. Moves
 * the persistent claim too, so the previous host won't reclaim it on return.
 */
export async function transferOwnership(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');
  const actorId = callerId(req);
  const { targetUid } = transferBody.parse(bodyOf(req));

  // Only someone actually watching can drive playback.
  const target = await findMember(db, roomId, targetUid);
  if (!target || !isPresent(target, Date.now())) throw RoomErrors.transferTargetAbsent();

  await changeRoomAsHost(roomId, actorId, async (tx) => {
    if (target.userId === actorId) throw RoomErrors.cannotTransferToSelf();
    await updateOwner(tx, roomId, target, true);
  });
  notify.membersChanged(roomId);
  res.status(204).end();
}
