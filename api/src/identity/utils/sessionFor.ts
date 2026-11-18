import { issueToken } from '../../http/auth.ts';
import type { User } from '../types.ts';
import { toProfile } from './toProfile.ts';

/** The reply to a successful sign-in or sign-up: the client stores all of it. */
export function sessionFor(user: User) {
  const { token, expiresAt } = issueToken(user);
  return { accessToken: token, expiresAt, user: toProfile(user) };
}
