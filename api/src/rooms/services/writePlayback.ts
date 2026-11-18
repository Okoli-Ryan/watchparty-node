import type { Request, Response } from 'express';
import { z } from 'zod';
import { callerId } from '../../http/auth.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import { updatePlayback } from '../repository/updatePlayback.ts';
import { playbackRate, playbackTime } from '../utils/schemas.ts';
import { changeRoomAsHost } from './changeRoomAsHost.ts';

export const playbackBody = z.object({
  isPlaying: z.boolean(),
  currentTime: playbackTime,
  rate: playbackRate,
});

/** Host only: the host played, paused, seeked or changed rate. */
export async function writePlayback(req: Request, res: Response) {
  const playback = playbackBody.parse(bodyOf(req));
  const actorId = callerId(req);

  await changeRoomAsHost(uuidParam(req, 'roomId'), actorId, (tx, room) =>
    updatePlayback(tx, room.id, actorId, playback),
  );
  res.status(204).end();
}
