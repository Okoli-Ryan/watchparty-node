import type { users } from '../db/schema.ts';

/** An account as stored, password hash included. Never sent to a client. */
export type User = typeof users.$inferSelect;

/** What the client sees of an account: never the password hash. */
export interface UserProfileDto {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: number;
}
