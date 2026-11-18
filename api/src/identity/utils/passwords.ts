import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Password hashing with bcrypt (bcryptjs: pure JavaScript, no native build).
// The cost factor and salt are stored inside each hash, so the cost can be
// raised later without breaking hashes already stored.
//
// bcrypt reads at most 72 bytes of a password; sign-up rejects longer ones
// (see signUp.ts) so nothing is silently ignored.
// ---------------------------------------------------------------------------

/** 2^12 rounds: roughly a quarter of a second per hash on a typical server. */
const COST = 12;

export const MAX_PASSWORD_BYTES = 72;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

/** True when `password` matches `storedHash`. bcrypt compares in constant time. */
export function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

let decoyHash: Promise<string> | null = null;

/**
 * A real hash of a random password nobody knows. Sign-in checks against it when
 * the e-mail is unknown, so an unknown account takes as long to reject as a
 * wrong password and response timing does not reveal which accounts exist.
 */
export function getDecoyHash(): Promise<string> {
  decoyHash ??= hashPassword(randomUUID());
  return decoyHash;
}
