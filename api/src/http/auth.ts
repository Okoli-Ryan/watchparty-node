import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';
import { RequestErrors } from './errors.ts';
import { isUuid } from './input.ts';

// ---------------------------------------------------------------------------
// The API issues its own bearer tokens (DECISIONS.md #29): HS256 JWTs whose
// `sub` is the user's id. Every route except sign-in and sign-up requires one.
// ---------------------------------------------------------------------------

export interface TokenSubject {
  id: string;
  displayName: string;
  role: string;
}

export interface IssuedToken {
  token: string;
  /** Epoch ms when the token stops being accepted. */
  expiresAt: number;
}

export function issueToken(user: TokenSubject): IssuedToken {
  const lifetimeSeconds = Math.floor(config.jwt.lifetimeMs / 1000);
  const token = jwt.sign({ name: user.displayName, role: user.role }, config.jwt.secret, {
    algorithm: 'HS256',
    subject: user.id,
    jwtid: randomUUID(),
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    expiresIn: lifetimeSeconds,
  });

  return { token, expiresAt: Date.now() + lifetimeSeconds * 1000 };
}

/** The user id inside a valid token, or null if the token is invalid or expired. */
export function readUserId(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    if (typeof payload === 'string' || !isUuid(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** The token from an `Authorization: Bearer <token>` header, or null. */
export function bearerToken(authorizationHeader: string | undefined): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader ?? '');
  return match ? match[1].trim() : null;
}

/** Middleware: rejects the request with 401 unless it carries a valid token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = bearerToken(req.headers.authorization);
  const userId = token ? readUserId(token) : null;
  if (!userId) {
    next(RequestErrors.signedOut());
    return;
  }

  req.userId = userId;
  next();
}

/** The signed-in caller. Only valid in routes behind requireAuth. */
export function callerId(req: Request): string {
  if (!req.userId) throw RequestErrors.signedOut();
  return req.userId;
}
