import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { uuidParam } from '../../http/input.ts';
import * as notify from '../../realtime/notify.ts';
import { deleteEntry } from '../repository/deleteEntry.ts';

/** Forgets a room. Idempotent: removing a room that is not there succeeds. */
export async function removeFromHistory(req: Request, res: Response) {
  const userId = callerId(req);
  const roomId = uuidParam(req, 'roomId');

  const removed = await deleteEntry(db, userId, roomId);
  if (removed) notify.historyChanged(userId, roomId);
  res.status(204).end();
}
