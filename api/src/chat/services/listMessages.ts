import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { pageLimit, uuidParam } from '../../http/input.ts';
import { listRecentMessages } from '../repository/listRecentMessages.ts';

const MAX_CHAT_PAGE = 100;
const listMessagesQuery = z.object({ limit: pageLimit(MAX_CHAT_PAGE) });

/** The room's newest messages, oldest first, still encrypted. */
export async function listMessages(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');
  const { limit } = listMessagesQuery.parse(req.query);
  res.json(await listRecentMessages(db, roomId, limit));
}
