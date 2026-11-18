import type { Db } from '../../db/database.ts';
import { historyEntries } from '../../db/schema.ts';
import { entryColumns } from '../utils/entryColumns.ts';
import { isEntry } from '../utils/isEntry.ts';

export async function findEntry(db: Db, userId: string, roomId: string) {
  const [entry] = await db.select(entryColumns).from(historyEntries).where(isEntry(userId, roomId));
  return entry ?? null;
}
