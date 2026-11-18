import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { pageLimit } from '../../http/input.ts';
import { listRecentRooms } from '../repository/listRecentRooms.ts';
import { toRoomDto } from '../utils/toRoomDto.ts';

const MAX_ROOM_PAGE = 50;

const listRoomsQuery = z.object({
  limit: pageLimit(MAX_ROOM_PAGE),
  before: z.coerce.number().int('before must be a whole number.').optional(),
});

/** Recent rooms, newest first. Page with `?before=` = the last room's createdAt. */
export async function listRooms(req: Request, res: Response) {
  const { limit, before } = listRoomsQuery.parse(req.query);
  const rooms = await listRecentRooms(db, limit, before);
  res.json(rooms.map(toRoomDto));
}
