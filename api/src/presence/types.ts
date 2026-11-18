import type { memberships } from '../db/schema.ts';

/** One person's presence in one room. */
export type Member = typeof memberships.$inferSelect;

export type MemberRole = Member['role'];
