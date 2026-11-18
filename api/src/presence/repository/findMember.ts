import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { memberships } from '../../db/schema.ts';
import type { Member } from '../types.ts';

export async function findMember(db: Db, roomId: string, userId: string): Promise<Member | null> {
  const [member] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.roomId, roomId), eq(memberships.userId, userId)));
  return member ?? null;
}
