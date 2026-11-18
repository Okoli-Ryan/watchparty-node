import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';

export interface HostPosition {
  currentTime: number;
  isPlaying: boolean;
}

/**
 * Stamps the room as still alive and, optionally, where the host's playhead is.
 * Never touches playback, so viewers are not realigned by it (DECISIONS.md #10).
 */
export async function updateLiveness(tx: Db, roomId: string, position: HostPosition | null | undefined): Promise<void> {
  const now = Date.now();
  const hostPosition = position
    ? { hostCurrentTime: position.currentTime, hostIsPlaying: position.isPlaying, hostUpdatedAt: now }
    : {};

  await tx
    .update(rooms)
    .set({ lastActiveAt: now, ...hostPosition })
    .where(eq(rooms.id, roomId));
}
