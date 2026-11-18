import type { Request } from 'express';
import { z } from 'zod';
import { RequestErrors } from './errors.ts';

// ---------------------------------------------------------------------------
// Request input shared by every feature. Each route parses its own body with a
// zod schema (`schema.parse(req.body)`); a failure becomes Validation.Failed in
// problem.ts, naming each bad field.
// ---------------------------------------------------------------------------

/** A UUID in any letter case, like .NET's Guid (not only RFC version 4). */
export const uuid = z.guid().transform((value) => value.toLowerCase());

export function isUuid(value: unknown): value is string {
  return uuid.safeParse(value).success;
}

/** A route parameter that must be a UUID. Anything else is simply "no such route". */
export function uuidParam(req: Request, name: string): string {
  const parsed = uuid.safeParse(req.params[name]);
  if (!parsed.success) throw RequestErrors.routeNotFound();
  return parsed.data;
}

/** A `?limit=` page size, clamped to 1..max. Absent means max. */
export function pageLimit(max: number) {
  return z.coerce
    .number()
    .int('limit must be a whole number.')
    .optional()
    .transform((limit) => Math.min(Math.max(limit ?? max, 1), max));
}

/** The JSON body, or an empty object when the request had none. */
export function bodyOf(req: Request): unknown {
  return req.body ?? {};
}
