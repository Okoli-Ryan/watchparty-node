import type { rooms } from '../db/schema.ts';
import type { toRoomDto } from './utils/toRoomDto.ts';

/** A room as stored. */
export type Room = typeof rooms.$inferSelect;

/** A room as clients see it. */
export type RoomDto = ReturnType<typeof toRoomDto>;

/** Where the room's video lives. `frameOrigin` '' means the top document. */
export interface VideoSource {
  pageUrl: string;
  selector: string;
  frameOrigin: string;
}

/** How the room's chat key is held (DECISIONS.md #13). */
export interface ChatProtection {
  visibility: 'public' | 'private';
  /** Base64 AES key. Public rooms only, otherwise ''. */
  chatKey: string;
  /** Base64 PBKDF2 salt. Private rooms only, otherwise ''. */
  chatSalt: string;
  /** Known plaintext encrypted with the key, to check a passphrase. Private rooms only. */
  chatCheck: { iv: string; ct: string } | null;
}
