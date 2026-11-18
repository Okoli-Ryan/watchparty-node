import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';

export interface Playback {
  isPlaying: boolean;
  currentTime: number;
  rate: number;
}

/** Stores what the host last did. The server stamps the time. */
export async function updatePlayback(tx: Db, roomId: string, actorId: string, playback: Playback): Promise<void> {
  await tx
    .update(rooms)
    .set({
      playbackIsPlaying: playback.isPlaying,
      playbackCurrentTime: playback.currentTime,
      playbackRate: playback.rate,
      playbackUpdatedAt: Date.now(),
      playbackUpdatedBy: actorId,
    })
    .where(eq(rooms.id, roomId));
}
