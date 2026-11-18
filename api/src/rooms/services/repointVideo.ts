import type { Request, Response } from 'express';
import { z } from 'zod';
import { callerId } from '../../http/auth.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import { updateVideo } from '../repository/updateVideo.ts';
import { videoFields } from '../utils/schemas.ts';
import { changeRoomAsHost } from './changeRoomAsHost.ts';

export const videoBody = z.object(videoFields);

/** Host only: points the room at a different video. */
export async function repointVideo(req: Request, res: Response) {
  const { currentTime, ...video } = videoBody.parse(bodyOf(req));
  const actorId = callerId(req);

  await changeRoomAsHost(uuidParam(req, 'roomId'), actorId, (tx, room) =>
    updateVideo(tx, room.id, actorId, video, currentTime),
  );
  res.status(204).end();
}
