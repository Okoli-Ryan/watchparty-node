import { randomUUID } from 'node:crypto';
import type { Db } from '../../db/database.ts';
import { rooms } from '../../db/schema.ts';
import type { ChatProtection, VideoSource } from '../types.ts';

export interface NewRoom {
  name: string;
  video: VideoSource;
  chat: ChatProtection;
  owner: { id: string; displayName: string };
  currentTime: number;
}

/** Creates an active room, paused at `currentTime`, hosted by its creator. Returns its id. */
export async function insertRoom(db: Db, room: NewRoom): Promise<string> {
  const id = randomUUID();
  const now = Date.now();

  await db.insert(rooms).values({
    id,
    name: room.name,
    ...room.video,
    visibility: room.chat.visibility,
    chatKey: room.chat.chatKey,
    chatSalt: room.chat.chatSalt,
    chatCheckIv: room.chat.chatCheck?.iv ?? null,
    chatCheckCt: room.chat.chatCheck?.ct ?? null,
    ownerId: room.owner.id,
    ownerName: room.owner.displayName,
    primaryOwnerId: room.owner.id,
    primaryOwnerName: room.owner.displayName,
    playbackIsPlaying: false,
    playbackCurrentTime: room.currentTime,
    playbackRate: 1,
    playbackUpdatedAt: null,
    playbackUpdatedBy: room.owner.id,
    lastActiveAt: now,
    createdAt: now,
  });
  return id;
}
