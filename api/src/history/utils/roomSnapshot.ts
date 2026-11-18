import type { Room } from '../../rooms/types.ts';

/** What history keeps of a room: copied, so the history list needs no join. */
export function roomSnapshot(room: Room) {
  return { roomName: room.name, pageUrl: room.pageUrl, roomCreatedAt: room.createdAt };
}
