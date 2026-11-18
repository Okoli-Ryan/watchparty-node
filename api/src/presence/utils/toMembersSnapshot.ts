import type { Member } from '../types.ts';

/** The roster plus the server's clock, so clients age heartbeats against server time. */
export function toMembersSnapshot(roomId: string, members: Member[]) {
  return {
    roomId,
    members: members.map((member) => ({
      uid: member.userId,
      displayName: member.displayName,
      role: member.role,
      joinedAt: member.joinedAt,
      lastSeen: member.lastSeen,
    })),
    serverTime: Date.now(),
  };
}
