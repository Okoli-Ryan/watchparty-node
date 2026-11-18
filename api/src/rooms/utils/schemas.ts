import { z } from 'zod';

// ---------------------------------------------------------------------------
// zod rules for the fields room requests share. Each service builds its own
// request body from these. Every message is written to be shown to a person.
// ---------------------------------------------------------------------------

const ROOM_NAME_MAX_LENGTH = 120;
const MAX_URL_LENGTH = 4096;
const MAX_SELECTOR_LENGTH = 4096;
const MAX_ORIGIN_LENGTH = 512;
const MAX_IV_LENGTH = 64;
/** Room for the client's 500-character limit as UTF-8, plus the GCM tag, as base64. */
const MAX_CIPHERTEXT_LENGTH = 4096;
/** Upper bound on a position (about 115 days): rejects garbage, admits any real video. */
const MAX_SECONDS = 10_000_000;
const MIN_PLAYBACK_RATE = 0.0625;
const MAX_PLAYBACK_RATE = 16;

export const MAX_KEY_MATERIAL_LENGTH = 128;
export const UNTITLED_ROOM = 'Untitled room';

const PAGE_URL_MESSAGE = 'The page URL must be an absolute http(s) URL.';
const SELECTOR_MESSAGE = 'A CSS selector for the video is required.';
const FRAME_ORIGIN_MESSAGE = 'The frame origin must be empty or an http(s) origin.';
const PLAYBACK_TIME_MESSAGE = 'Playback time must be a finite, non-negative number of seconds.';
const PLAYBACK_RATE_MESSAGE = `Playback rate must be between ${MIN_PLAYBACK_RATE} and ${MAX_PLAYBACK_RATE}.`;
const CIPHERTEXT_MESSAGE = 'The encrypted payload is malformed or too large.';
export const CHAT_KEY_MESSAGE = 'Public rooms carry a key; private rooms carry a salt and a verifier, never a key.';

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** An origin is a bare scheme://host[:port], nothing more. */
function isHttpOrigin(value: string): boolean {
  return isHttpUrl(value) && new URL(value).origin.toLowerCase() === value.toLowerCase();
}

/** Standard, padded, non-empty base64 of at most `maxLength` characters. */
export function base64(maxLength: number, message: string) {
  return z
    .string(message)
    .min(1, message)
    .max(maxLength, message)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/, message)
    .refine((value) => value.length % 4 === 0, message);
}

/** A blank name becomes "Untitled room". */
export const roomName = z
  .string()
  .nullish()
  .transform((raw) => raw?.trim() || UNTITLED_ROOM)
  .pipe(z.string().max(ROOM_NAME_MAX_LENGTH, `Room names are at most ${ROOM_NAME_MAX_LENGTH} characters.`));

export const pageUrl = z.string(PAGE_URL_MESSAGE).max(MAX_URL_LENGTH, PAGE_URL_MESSAGE).refine(isHttpUrl, PAGE_URL_MESSAGE);

export const selector = z
  .string(SELECTOR_MESSAGE)
  .max(MAX_SELECTOR_LENGTH, SELECTOR_MESSAGE)
  .refine((value) => value.trim().length > 0, SELECTOR_MESSAGE);

/** Origin of the frame holding the video; empty means the top document. */
export const frameOrigin = z
  .string(FRAME_ORIGIN_MESSAGE)
  .max(MAX_ORIGIN_LENGTH, FRAME_ORIGIN_MESSAGE)
  .nullish()
  .transform((value) => value?.trim() ?? '')
  .refine((value) => value === '' || isHttpOrigin(value), FRAME_ORIGIN_MESSAGE);

export const playbackTime = z
  .number(PLAYBACK_TIME_MESSAGE)
  .min(0, PLAYBACK_TIME_MESSAGE)
  .max(MAX_SECONDS, PLAYBACK_TIME_MESSAGE);

export const playbackRate = z
  .number(PLAYBACK_RATE_MESSAGE)
  .min(MIN_PLAYBACK_RATE, PLAYBACK_RATE_MESSAGE)
  .max(MAX_PLAYBACK_RATE, PLAYBACK_RATE_MESSAGE);

/** AES-GCM output from the client. The server stores and relays it, never reads it. */
export const encryptedText = z.object({
  iv: base64(MAX_IV_LENGTH, CIPHERTEXT_MESSAGE),
  ct: base64(MAX_CIPHERTEXT_LENGTH, CIPHERTEXT_MESSAGE),
});

/** The fields that point a room at a video, and where its playhead starts. */
export const videoFields = { pageUrl, selector, frameOrigin, currentTime: playbackTime };
