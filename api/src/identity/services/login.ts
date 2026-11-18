import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.ts';
import { UserErrors } from '../../http/errors.ts';
import { bodyOf } from '../../http/input.ts';
import { findUserByEmail } from '../repository/findUserByEmail.ts';
import { getDecoyHash, verifyPassword } from '../utils/passwords.ts';
import { sessionFor } from '../utils/sessionFor.ts';

const loginBody = z.object({
  // Trimmed and lower-cased, as e-mails are stored.
  email: z.string('An e-mail address is required.').trim().toLowerCase().min(1, 'An e-mail address is required.').max(254),
  password: z.string('A password is required.').min(1, 'A password is required.').max(256),
});

/** Signs in an existing account and returns its session. */
export async function login(req: Request, res: Response) {
  const { email, password } = loginBody.parse(bodyOf(req));

  const user = await findUserByEmail(db, email);
  // Always verify a hash, even for an unknown e-mail, so timing reveals nothing.
  const hashToCheck = user?.passwordHash ?? (await getDecoyHash());
  const passwordMatches = await verifyPassword(hashToCheck, password);

  if (!user || !passwordMatches) throw UserErrors.invalidCredentials();
  res.json(sessionFor(user));
}
