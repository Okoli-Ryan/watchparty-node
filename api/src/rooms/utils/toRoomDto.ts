import type { Room } from '../types.ts';

/** A room as clients see it: field names match the extension's `Room` type. */
export function toRoomDto(room: Room) {
  const hasChatCheck = room.chatCheckIv !== null && room.chatCheckCt !== null;
  const hasHostPosition = room.hostCurrentTime !== null && room.hostUpdatedAt !== null;

  return {
    id: room.id,
    name: room.name,
    pageUrl: room.pageUrl,
    selector: room.selector,
    frameOrigin: room.frameOrigin,
    visibility: room.visibility,
    chatKey: room.chatKey,
    chatSalt: room.chatSalt,
    chatCheck: hasChatCheck ? { iv: room.chatCheckIv, ct: room.chatCheckCt } : null,
    ownerUid: room.ownerId,
    ownerName: room.ownerName,
    primaryOwnerUid: room.primaryOwnerId,
    primaryOwnerName: room.primaryOwnerName,
    isActive: room.isActive,
    playback: {
      isPlaying: room.playbackIsPlaying,
      currentTime: room.playbackCurrentTime,
      rate: room.playbackRate,
      updatedAt: room.playbackUpdatedAt,
      updatedBy: room.playbackUpdatedBy,
    },
    hostPosition: hasHostPosition
      ? { currentTime: room.hostCurrentTime, isPlaying: room.hostIsPlaying, updatedAt: room.hostUpdatedAt }
      : null,
    lastActiveAt: room.lastActiveAt,
    createdAt: room.createdAt,
  };
}
