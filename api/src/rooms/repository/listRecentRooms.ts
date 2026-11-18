import { desc, lt } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';
import type { Room } from '../types.ts';

/** Newest first, live and ended alike. Page with `before` = the last room's createdAt. */
export async function listRecentRooms(db: Db, limit: number, before: number | undefined): Promise<Room[]> {
  return db
    .select()
    .from(rooms)
    .where(before === undefined ? undefined : lt(rooms.createdAt, before))
    .orderBy(desc(rooms.createdAt))
    .limit(limit);
}
