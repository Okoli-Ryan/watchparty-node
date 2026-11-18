import { eq } from 'drizzle-orm';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';
import type { VideoSource } from '../types.ts';

/**
 * Points the room at a different video. Playback restarts paused at
 * `currentTime`, so viewers don't inherit a timestamp from the old video.
 */
export async function updateVideo(
  tx: Db,
  roomId: string,
  actorId: string,
  video: VideoSource,
  currentTime: number,
): Promise<void> {
  await tx
    .update(rooms)
    .set({
      ...video,
      playbackIsPlaying: false,
      playbackCurrentTime: currentTime,
      playbackRate: 1,
      playbackUpdatedAt: Date.now(),
      playbackUpdatedBy: actorId,
      hostCurrentTime: null,
      hostIsPlaying: null,
      hostUpdatedAt: null,
    })
    .where(eq(rooms.id, roomId));
}
