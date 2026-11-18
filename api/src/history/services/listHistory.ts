import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { pageLimit } from '../../http/input.ts';
import { listAttended } from '../repository/listAttended.ts';

const MAX_HISTORY_PAGE = 200;
const listHistoryQuery = z.object({ limit: pageLimit(MAX_HISTORY_PAGE) });

/** The caller's attended rooms, most recent first. */
export async function listHistory(req: Request, res: Response) {
  const { limit } = listHistoryQuery.parse(req.query);
  res.json(await listAttended(db, callerId(req), limit));
}
