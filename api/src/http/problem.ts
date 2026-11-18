import * as Sentry from '@sentry/node';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.ts';
import { ApiError, RequestErrors, type FieldMessages } from './errors.ts';

// ---------------------------------------------------------------------------
// Turns anything a handler throws into an RFC 9457 Problem Details reply:
//   { title, status, detail, code, errors? }
// Unexpected faults are logged and answered with a bare 500: no stack trace or
// internal message ever leaves the server.
// ---------------------------------------------------------------------------

const TITLES: Record<number, string> = {
  400: 'The request is invalid.',
  401: 'Unauthorized.',
  403: 'Forbidden.',
  404: 'Not found.',
  409: 'Conflict.',
  413: 'The request is too large.',
};

function sendProblem(res: Response, error: ApiError): void {
  const body: Record<string, unknown> = {
    title: TITLES[error.status] ?? 'Error.',
    status: error.status,
    detail: error.message,
    code: error.code,
  };
  if (error.fields) body.errors = error.fields;

  res.status(error.status).type('application/problem+json').json(body);
}

/** Groups zod's issues by field path, e.g. { "position.currentTime": ["..."] }. */
function fieldMessages(error: ZodError): FieldMessages {
  const fields: FieldMessages = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body';
    fields[field] = [...(fields[field] ?? []), issue.message];
  }
  return fields;
}

/**
 * express.json() reports a body it cannot parse (bad JSON, too large) as an
 * error carrying a 4xx `status`. Those are the client's fault, not ours.
 */
function isBodyParserError(error: unknown): error is { status: number } {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = (error as { status: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

/** Final middleware for any request no route matched. */
export function routeNotFound(_req: Request, _res: Response, next: NextFunction): void {
  next(RequestErrors.routeNotFound());
}

/** Express error middleware: must keep all four parameters to be recognised as one. */
export function problemHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ApiError) {
    sendProblem(res, error);
    return;
  }

  if (error instanceof ZodError) {
    sendProblem(res, RequestErrors.invalidFields(fieldMessages(error)));
    return;
  }

  if (isBodyParserError(error)) {
    sendProblem(res, new ApiError(error.status, 'Request.Malformed', 'The request body could not be read.'));
    return;
  }

  logger.error({ err: error, method: req.method, path: req.path }, 'unhandled error');
  Sentry.captureException(error); // no-op when SENTRY_DSN is unset
  res.status(500).type('application/problem+json').json({ title: 'Something went wrong.', status: 500 });
}
