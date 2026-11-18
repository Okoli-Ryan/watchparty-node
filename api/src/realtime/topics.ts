import { isUuid } from '../http/input.ts';

// ---------------------------------------------------------------------------
// What a client can subscribe to, and the group of connections behind each.
// These stand in for the Firestore listeners the extension used to open.
//
//   rooms         every room as it changes (room list, dashboard)
//   history       the CALLER's own history; never anyone else's
//   room:<id>     one room
//   members:<id>  one room's roster
//   chat:<id>     one room's chat
// ---------------------------------------------------------------------------

export const ROOMS_GROUP = 'rooms';

export const roomGroup = (roomId: string) => `room:${roomId}`;
export const membersGroup = (roomId: string) => `members:${roomId}`;
export const chatGroup = (roomId: string) => `chat:${roomId}`;
export const historyGroup = (userId: string) => `history:${userId}`;

const ROOM_SCOPED_TOPICS = ['room', 'members', 'chat'];

/** The group a caller may join for `topic`, or null if there is no such topic. */
export function resolveGroup(topic: unknown, callerId: string): string | null {
  if (topic === 'rooms') return ROOMS_GROUP;
  if (topic === 'history') return historyGroup(callerId);
  if (typeof topic !== 'string') return null;

  const [kind, roomId, ...rest] = topic.split(':');
  const isRoomScoped = ROOM_SCOPED_TOPICS.includes(kind) && isUuid(roomId) && rest.length === 0;
  return isRoomScoped ? `${kind}:${roomId.toLowerCase()}` : null;
}
