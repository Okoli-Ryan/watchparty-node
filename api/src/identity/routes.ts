import { Router } from 'express';
import { signInRateLimit } from '../http/security.ts';
import { getMyProfile } from './services/getMyProfile.ts';
import { login } from './services/login.ts';
import { signUp } from './services/signUp.ts';

/** Sign-in and sign-up: the only routes that work without a token. */
export const publicIdentityRoutes = Router();
publicIdentityRoutes.post('/auth/login', signInRateLimit, login);
publicIdentityRoutes.post('/auth/register', signInRateLimit, signUp);

export const identityRoutes = Router();
identityRoutes.get('/me', getMyProfile);
