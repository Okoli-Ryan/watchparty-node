import type { Request, Response } from 'express';
import { z } from 'zod';
import { db, isUniqueViolation } from '../../db/database.ts';
import { UserErrors } from '../../http/errors.ts';
import { bodyOf } from '../../http/input.ts';
import { findUserByEmail } from '../repository/findUserByEmail.ts';
import { insertUser } from '../repository/insertUser.ts';
import { hashPassword, MAX_PASSWORD_BYTES } from '../utils/passwords.ts';
import { sessionFor } from '../utils/sessionFor.ts';

const DISPLAY_NAME_MAX_LENGTH = 80;
const PASSWORD_LENGTH_MESSAGE = 'Passwords are 8 to 72 characters.';

export const signUpBody = z.object({
  // Trimmed and lower-cased, so one address is one account however it is typed.
  email: z
    .string('An e-mail address is required.')
    .trim()
    .toLowerCase()
    .pipe(z.email('That is not a valid e-mail address.').max(254)),
  displayName: z
    .string('A display name is required.')
    .trim()
    .min(1, 'A display name is required.')
    .max(DISPLAY_NAME_MAX_LENGTH, `Display names are at most ${DISPLAY_NAME_MAX_LENGTH} characters.`),
  password: z
    .string('A password is required.')
    .min(8, PASSWORD_LENGTH_MESSAGE)
    // bcrypt ignores everything past 72 bytes; refuse rather than silently truncate.
    .refine((password) => Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES, PASSWORD_LENGTH_MESSAGE),
});

/** Creates an ordinary user and signs them straight in, so sign-up is one step for the client. */
export async function signUp(req: Request, res: Response) {
  const { email, displayName, password } = signUpBody.parse(bodyOf(req));
  if (await findUserByEmail(db, email)) throw UserErrors.emailTaken();

  try {
    const user = await insertUser(db, email, displayName, await hashPassword(password));
    res.status(201).location('/api/v1/me').json(sessionFor(user));
  } catch (error) {
    // Two sign-ups for the same address at once: the unique index catches the loser.
    if (isUniqueViolation(error)) throw UserErrors.emailTaken();
    throw error;
  }
}
