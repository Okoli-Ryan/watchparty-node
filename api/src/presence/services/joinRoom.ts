import type { Request, Response } from 'express';
import { callerId } from '../../http/auth.ts';
import { uuidParam } from '../../http/input.ts';
import { enterRoom } from './enterRoom.ts';
import { reconcileRoom } from './reconcileRoom.ts';

/**
 * Joins (or rejoins) a room as the caller, then settles who should be hosting.
 * Returns the role the SERVER decided: a returning primary owner gets the room back.
 */
export async function joinRoom(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');
  const role = await enterRoom(callerId(req), roomId);
  await reconcileRoom(roomId);
  res.json({ role });
}
