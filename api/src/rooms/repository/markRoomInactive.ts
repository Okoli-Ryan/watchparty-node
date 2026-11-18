import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';

/** Ends the room: the last member has left. */
export async function markRoomInactive(tx: Db, roomId: string): Promise<void> {
  await tx.update(rooms).set({ isActive: false }).where(eq(rooms.id, roomId));
}
