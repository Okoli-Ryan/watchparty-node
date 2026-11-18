import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';
import type { Room } from '../types.ts';

export async function findRoom(db: Db, roomId: string): Promise<Room | null> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  return room ?? null;
}
