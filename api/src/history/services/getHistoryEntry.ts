import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { HistoryErrors } from '../../http/errors.ts';
import { uuidParam } from '../../http/input.ts';
import { findEntry } from '../repository/findEntry.ts';

/** The caller's entry for one room, including one that only has a read position. */
export async function getHistoryEntry(req: Request, res: Response) {
  const entry = await findEntry(db, callerId(req), uuidParam(req, 'roomId'));
  if (!entry) throw HistoryErrors.notFound();
  res.json(entry);
}
