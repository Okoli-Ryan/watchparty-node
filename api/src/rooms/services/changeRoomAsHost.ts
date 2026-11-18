import { db, type Db } from '../../db/database.ts';
import { RoomErrors } from '../../http/errors.ts';
import * as notify from '../../realtime/notify.ts';
import { lockRoom } from '../repository/lockRoom.ts';
import type { Room } from '../types.ts';

/**
 * The step every host action shares: lock the room, check the caller is its
 * current host, apply `change`, commit, and tell subscribers.
 */
export async function changeRoomAsHost(
  roomId: string,
  actorId: string,
  change: (tx: Db, room: Room) => Promise<void>,
): Promise<void> {
  await db.transaction(async (tx) => {
    const room = await lockRoom(tx, roomId);
    if (!room) throw RoomErrors.notFound();
    
    if (!room.isActive) throw RoomErrors.inactive();
    if (room.ownerId !== actorId) throw RoomErrors.notOwner();

    await change(tx, room);
  });
  notify.roomChanged(roomId);
}
