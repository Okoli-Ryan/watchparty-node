import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';
import type { Room } from '../types.ts';

/**
 * Reads a room and locks its row until the transaction ends, so two writers
 * (a playback write and a heartbeat, say) never interleave. Call inside a
 * transaction. Null if the room does not exist.
 */
export async function lockRoom(tx: Db, roomId: string): Promise<Room | null> {
  const [room] = await tx.select().from(rooms).where(eq(rooms.id, roomId)).for('update');
  return room ?? null;
}
