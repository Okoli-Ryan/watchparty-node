import { historyEntries } from '../../db/schema.ts';

/** The columns a client receives, under the names it expects. */
export const entryColumns = {
  roomId: historyEntries.roomId,
  roomName: historyEntries.roomName,
  pageUrl: historyEntries.pageUrl,
  favourite: historyEntries.isFavourite,
  lastAttendedAt: historyEntries.lastAttendedAt,
  roomCreatedAt: historyEntries.roomCreatedAt,
  lastReadAt: historyEntries.lastReadAt,
};
