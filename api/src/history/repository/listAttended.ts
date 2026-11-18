import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import { entryColumns } from '../utils/entryColumns.ts';

/**
 * Attended rooms, most recent first. Entries that only carry a read position
 * (a room watched from the dashboard but never joined) are left out.
 */
export async function listAttended(db: Db, userId: string, limit: number) {
  return db
    .select(entryColumns)
    .from(historyEntries)
    .where(and(eq(historyEntries.userId, userId), isNotNull(historyEntries.lastAttendedAt)))
    .orderBy(desc(historyEntries.lastAttendedAt))
    .limit(limit);
}
