import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { memberships, rooms } from '../../db/schema.ts';

/**
 * Makes someone the host, and keeps every member's role in step with it.
 * `claimPrimary` also moves the persistent claim (a deliberate transfer);
 * automatic handoff and reclaiming leave it where it is (DECISIONS.md #8).
 */
export async function updateOwner(
  tx: Db,
  roomId: string,
  owner: { userId: string; displayName: string },
  claimPrimary: boolean,
): Promise<void> {
  const host = { ownerId: owner.userId, ownerName: owner.displayName };
  const primaryClaim = claimPrimary ? { primaryOwnerId: owner.userId, primaryOwnerName: owner.displayName } : {};
  await tx
    .update(rooms)
    .set({ ...host, ...primaryClaim })
    .where(eq(rooms.id, roomId));

  await tx
    .update(memberships)
    .set({ role: sql`CASE WHEN ${memberships.userId} = ${owner.userId} THEN 'owner' ELSE 'viewer' END` })
    .where(eq(memberships.roomId, roomId));
}
