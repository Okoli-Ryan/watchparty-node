import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { RoomErrors } from '../../http/errors.ts';
import { uuidParam } from '../../http/input.ts';
import { findRoom } from '../repository/findRoom.ts';
import { toRoomDto } from '../utils/toRoomDto.ts';

export async function getRoom(req: Request, res: Response) {
  const room = await findRoom(db, uuidParam(req, 'roomId'));
  if (!room) throw RoomErrors.notFound();
  res.json(toRoomDto(room));
}
