import { pino } from 'pino';
import { config } from './config.ts';

/**
 * Structured JSON logs. In development, `npm run dev` pipes them through
 * pino-pretty to make them readable.
 */
export const logger = pino({ level: config.logLevel });
