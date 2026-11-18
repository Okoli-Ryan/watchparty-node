import type { Request, Response } from 'express';
import { db } from '../../db/database.ts';
import { callerId } from '../../http/auth.ts';
import { UserErrors } from '../../http/errors.ts';
import { findUserById } from '../repository/findUserById.ts';
import { toProfile } from '../utils/toProfile.ts';

/** The signed-in caller's own profile. */
export async function getMyProfile(req: Request, res: Response) {
  const user = await findUserById(db, callerId(req));
  if (!user) throw UserErrors.notFound();
  res.json(toProfile(user));
}
