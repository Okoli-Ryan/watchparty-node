import { db } from '../../db/database.ts';
import * as notify from '../../realtime/notify.ts';
import { lockRoom } from '../../rooms/repository/lockRoom.ts';
import { markRoomInactive } from '../../rooms/repository/markRoomInactive.ts';
import { updateOwner } from '../../rooms/repository/updateOwner.ts';
import { listMembers } from '../repository/listMembers.ts';
import { removeMembers } from '../repository/removeMembers.ts';
import { planSuccession } from '../utils/succession.ts';

/**
 * Shared by join, heartbeat and leave: prunes members who have gone quiet,
 * hands a hostless room to its heir, and ends a room nobody is left in.
 * Idempotent. The room row is locked, so two reconciles can't race.
 */
export async function reconcileRoom(roomId: string): Promise<void> {
  const outcome = await db.transaction(async (tx) => {
    const room = await lockRoom(tx, roomId);
    if (!room || !room.isActive) return null;

    const members = await listMembers(tx, roomId);
    const plan = planSuccession(room, members, Date.now());

    const prunedCount = await removeMembers(tx, roomId, plan.stale.map((member) => member.userId));
    const nobodyLeft = members.length === plan.stale.length;

    if (plan.heir) {
      await updateOwner(tx, roomId, plan.heir, false);
    } else if (nobodyLeft) {
      // The last person out turns off the lights.
      await markRoomInactive(tx, roomId);
    }

    return { rosterChanged: prunedCount > 0 || plan.heir !== null, roomChanged: plan.heir !== null || nobodyLeft };
  });

  if (outcome?.rosterChanged) notify.membersChanged(roomId);
  if (outcome?.roomChanged) notify.roomChanged(roomId);
}
