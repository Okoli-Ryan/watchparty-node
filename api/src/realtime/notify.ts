import { findMessage } from '../chat/repository/findMessage.ts';
import { db } from '../db/database.ts';
import { findEntry } from '../history/repository/findEntry.ts';
import { logger } from '../logger.ts';
import { listMembers } from '../presence/repository/listMembers.ts';
import { toMembersSnapshot } from '../presence/utils/toMembersSnapshot.ts';
import { findRoom } from '../rooms/repository/findRoom.ts';
import { toRoomDto } from '../rooms/utils/toRoomDto.ts';
import { sendToGroups } from './socket.ts';
import { chatGroup, historyGroup, membersGroup, ROOMS_GROUP, roomGroup } from './topics.ts';

// ---------------------------------------------------------------------------
// "Something changed" → read the fresh state ONCE → push it to every subscriber,
// instead of having every client refetch.
//
// Call these after a change has committed. Signals raised in the same tick are
// de-duplicated (a reconcile that touches room and roster, a burst of
// heartbeats), so each piece of state is read and sent once.
//
// A lost push is never relied on: clients reload everything after a reconnect
// (DECISIONS.md #21).
// ---------------------------------------------------------------------------

type Push = () => Promise<void>;

const pending = new Map<string, Push>();
let flushScheduled = false;

async function flush(): Promise<void> {
  flushScheduled = false;
  const pushes = [...pending.values()];
  pending.clear();

  for (const push of pushes) {
    try {
      await push();
    } catch (error) {
      // One failed push must not stop the rest; the next change resends.
      logger.warn({ err: error }, 'realtime push failed');
    }
  }
}

function schedule(key: string, push: Push): void {
  pending.set(key, push);
  if (!flushScheduled) {
    flushScheduled = true;
    setImmediate(() => void flush());
  }
}

/** The room itself changed: its video, playback, host, liveness, or whether it is still active. */
export function roomChanged(roomId: string): void {
  schedule(`room:${roomId}`, async () => {
    const room = await findRoom(db, roomId);
    if (room) sendToGroups([roomGroup(roomId), ROOMS_GROUP], 'room', toRoomDto(room));
  });
}

/** Who is in the room changed (join, heartbeat, leave, role): the roster is resent. */
export function membersChanged(roomId: string): void {
  schedule(`members:${roomId}`, async () => {
    const members = await listMembers(db, roomId);
    sendToGroups([membersGroup(roomId)], 'members', toMembersSnapshot(roomId, members));
  });
}

const MEMBERS_COALESCE_MS = 2_000;
const membersPending = new Set<string>();

/**
 * For heartbeats: clients age members by their `lastSeen`, so the roster must
 * keep flowing, but one push per beat from every member is wasteful. Beats
 * landing within the window share a single (trailing) push, so none is lost.
 */
export function membersChangedSoon(roomId: string): void {
  if (membersPending.has(roomId)) return;
  membersPending.add(roomId);
  setTimeout(() => {
    membersPending.delete(roomId);
    membersChanged(roomId);
  }, MEMBERS_COALESCE_MS).unref();
}

/** A new chat message: only that message is sent. */
export function messagePosted(roomId: string, messageId: string): void {
  schedule(`message:${messageId}`, async () => {
    const message = await findMessage(db, messageId);
    if (message) sendToGroups([chatGroup(roomId)], 'message', message);
  });
}

/** One user's history entry changed or was removed: only that user hears it. */
export function historyChanged(userId: string, roomId: string): void {
  schedule(`history:${userId}:${roomId}`, async () => {
    const entry = await findEntry(db, userId, roomId);
    sendToGroups([historyGroup(userId)], 'history', { roomId, entry });
  });
}
