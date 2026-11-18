import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { uuidParam } from '../../http/input.ts';
import { listMembers } from '../repository/listMembers.ts';
import { toMembersSnapshot } from '../utils/toMembersSnapshot.ts';

/** The room's roster, with the server's clock. */
export async function getMembers(req: Request, res: Response) {
  const roomId = uuidParam(req, 'roomId');
  res.json(toMembersSnapshot(roomId, await listMembers(db, roomId)));
}
