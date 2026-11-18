import type { User, UserProfileDto } from '../types.ts';

/** The public face of an account: everything but the password hash. */
export function toProfile(user: User): UserProfileDto {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
}
