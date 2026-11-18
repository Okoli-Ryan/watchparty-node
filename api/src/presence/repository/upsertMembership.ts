import type { Db } from '../../db/database.ts';
import { memberships } from '../../db/schema.ts';
import type { MemberRole } from '../types.ts';

/** Adds the member, or refreshes them on return. A rejoin keeps the original join time. */
export async function upsertMembership(
  tx: Db,
  roomId: string,
  user: { id: string; displayName: string },
  role: MemberRole,
): Promise<void> {
  const now = Date.now();
  await tx
    .insert(memberships)
    .values({ roomId, userId: user.id, displayName: user.displayName, role, joinedAt: now, lastSeen: now })
    .onConflictDoUpdate({
      target: [memberships.roomId, memberships.userId],
      set: { displayName: user.displayName, role, lastSeen: now },
    });
}
