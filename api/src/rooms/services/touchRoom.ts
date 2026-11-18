import type { Request, Response } from 'express';
import { z } from 'zod';
import { callerId } from '../../http/auth.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import { updateLiveness } from '../repository/updateLiveness.ts';
import { playbackTime } from '../utils/schemas.ts';
import { changeRoomAsHost } from './changeRoomAsHost.ts';

const touchBody = z.object({
  position: z.object({ currentTime: playbackTime, isPlaying: z.boolean() }).nullish(),
});

/** Host only: the room's liveness heartbeat, optionally carrying the host's playhead. */
export async function touchRoom(req: Request, res: Response) {
  const { position } = touchBody.parse(bodyOf(req));

  await changeRoomAsHost(uuidParam(req, 'roomId'), callerId(req), (tx, room) =>
    updateLiveness(tx, room.id, position),
  );
  res.status(204).end();
}
