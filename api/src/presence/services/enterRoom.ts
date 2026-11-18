import { db } from '../../db/database.ts';
import { upsertAttendance } from '../../history/repository/upsertAttendance.ts';
import { RoomErrors, UserErrors } from '../../http/errors.ts';
import { findUserById } from '../../identity/repository/findUserById.ts';
import { logger } from '../../logger.ts';
import * as notify from '../../realtime/notify.ts';
import { lockRoom } from '../../rooms/repository/lockRoom.ts';
import { updateOwner } from '../../rooms/repository/updateOwner.ts';
import { upsertMembership } from '../repository/upsertMembership.ts';
import type { MemberRole } from '../types.ts';

/**
 * Notes "I was here" in the user's history. A separate step after the join has
 * landed: if it fails, the join still stands, so it is logged, not thrown.
 */
async function recordAttendanceQuietly(userId: string, roomId: string): Promise<void> {
  try {
    await upsertAttendance(db, userId, roomId);
    notify.historyChanged(userId, roomId);
  } catch (error) {
    logger.warn({ err: error, roomId }, 'could not record attendance');
  }
}

/**
 * Shared by joining and by a heartbeat from someone who was pruned: gets a
 * user into a room and returns the role they hold there.
 *
 * The primary owner takes the room back on arrival: automatic handoff never
 * moves that claim, so a host who refreshes or steps away gets their room
 * back. Everyone else is whatever the room says they are.
 */
export async function enterRoom(userId: string, roomId: string): Promise<MemberRole> {
  const user = await findUserById(db, userId);
  if (!user) throw UserErrors.notFound();

  const { role, reclaimed } = await db.transaction(async (tx) => {
    const room = await lockRoom(tx, roomId);
    if (!room) throw RoomErrors.notFound();
    if (!room.isActive) throw RoomErrors.inactive();

    const reclaimed = room.primaryOwnerId === userId && room.ownerId !== userId;
    if (reclaimed) {
      await updateOwner(tx, roomId, { userId, displayName: user.displayName }, false);
    }

    const role: MemberRole = room.ownerId === userId || reclaimed ? 'owner' : 'viewer';
    await upsertMembership(tx, roomId, user, role);
    return { role, reclaimed };
  });

  notify.membersChanged(roomId);
  if (reclaimed) notify.roomChanged(roomId);
  await recordAttendanceQuietly(userId, roomId);
  return role;
}
