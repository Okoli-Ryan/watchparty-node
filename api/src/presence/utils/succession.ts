// ---------------------------------------------------------------------------
// Who hosts a room once its host has gone quiet, and who has gone stale.
//
// Pure functions: no database, no clock of their own. It runs on the server,
// against the complete membership and the server's clock (DECISIONS.md #26),
// so no client ever decides a handoff from a partial view.
// ---------------------------------------------------------------------------

/** A member whose last heartbeat is older than this is treated as gone. */
export const STALE_AFTER_MS = 30_000;

export interface MemberPresence {
  userId: string;
  displayName: string;
  /** First join only: decides who inherits. */
  joinedAt: number;
  lastSeen: number;
}

export interface RoomOwnership {
  isActive: boolean;
  ownerId: string;
  primaryOwnerId: string;
}

export interface SuccessionPlan {
  /** Who should host now, or null when no handoff is needed. */
  heir: MemberPresence | null;
  /** Members whose heartbeat has lapsed and should be removed. */
  stale: MemberPresence[];
}

export function isPresent(member: MemberPresence, now: number): boolean {
  return now - member.lastSeen <= STALE_AFTER_MS;
}

/** Earliest joiner first; user id breaks a tie so the order is always the same. */
function byJoinOrder(left: MemberPresence, right: MemberPresence): number {
  if (left.joinedAt !== right.joinedAt) return left.joinedAt - right.joinedAt;
  return left.userId.localeCompare(right.userId);
}

function chooseHeir(room: RoomOwnership, present: MemberPresence[]): MemberPresence | null {
  if (!room.isActive || present.length === 0) return null;

  const hostIsHere = present.some((member) => member.userId === room.ownerId);
  if (hostIsHere) return null;

  // The primary owner outranks join order: if they're here, the room goes back
  // to them rather than to whoever arrived first.
  const primaryOwner = present.find((member) => member.userId === room.primaryOwnerId);
  if (primaryOwner) return primaryOwner;

  return [...present].sort(byJoinOrder)[0];
}

export function planSuccession(room: RoomOwnership, members: MemberPresence[], now: number): SuccessionPlan {
  const present = members.filter((member) => isPresent(member, now));
  const stale = members.filter((member) => !isPresent(member, now));
  return { heir: chooseHeir(room, present), stale };
}
