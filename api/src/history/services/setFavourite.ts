import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { HistoryErrors } from '../../http/errors.ts';
import { bodyOf, uuidParam } from '../../http/input.ts';
import * as notify from '../../realtime/notify.ts';
import { updateFavourite } from '../repository/updateFavourite.ts';

const favouriteBody = z.object({ favourite: z.boolean() });

/** Stars or unstars a room. The room must already be in the caller's history. */
export async function setFavourite(req: Request, res: Response) {
  const userId = callerId(req);
  const roomId = uuidParam(req, 'roomId');
  const { favourite } = favouriteBody.parse(bodyOf(req));

  const updated = await updateFavourite(db, userId, roomId, favourite);
  if (!updated) throw HistoryErrors.notFound();

  notify.historyChanged(userId, roomId);
  res.status(204).end();
}
