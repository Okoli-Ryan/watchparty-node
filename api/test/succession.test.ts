import { describe, expect, it } from 'vitest';
import { planSuccession, STALE_AFTER_MS, type MemberPresence } from '../src/presence/utils/succession.ts';

const NOW = 1_000_000;

function member(userId: string, joinedAt: number, lastSeen = NOW): MemberPresence {
  return { userId, displayName: userId, joinedAt, lastSeen };
}

const room = { isActive: true, ownerId: 'host', primaryOwnerId: 'host' };

describe('planSuccession', () => {
  it('leaves the room alone while the host is present', () => {
    const plan = planSuccession(room, [member('host', 1), member('viewer', 2)], NOW);
    expect(plan.heir).toBeNull();
    expect(plan.stale).toEqual([]);
  });

  it('hands a hostless room to the earliest joiner still present', () => {
    const members = [member('late', 30), member('early', 10), member('middle', 20)];
    expect(planSuccession(room, members, NOW).heir?.userId).toBe('early');
  });

  it('prefers the primary owner over join order', () => {
    const inherited = { ...room, ownerId: 'early' };
    const members = [member('host', 50), member('viewer', 5)];
    expect(planSuccession(inherited, members, NOW).heir?.userId).toBe('host');
  });

  it('treats a lapsed heartbeat as gone, and never picks a stale heir', () => {
    const lapsed = NOW - STALE_AFTER_MS - 1;
    const members = [member('host', 1, lapsed), member('ghost', 2, lapsed), member('viewer', 3)];
    const plan = planSuccession(room, members, NOW);

    expect(plan.heir?.userId).toBe('viewer');
    expect(plan.stale.map((stale) => stale.userId)).toEqual(['host', 'ghost']);
  });

  it('breaks a join-time tie by user id, so every run agrees', () => {
    expect(planSuccession(room, [member('b', 7), member('a', 7)], NOW).heir?.userId).toBe('a');
  });

  it('names no heir for an ended room or an empty one', () => {
    expect(planSuccession({ ...room, isActive: false }, [member('viewer', 1)], NOW).heir).toBeNull();
    expect(planSuccession(room, [], NOW).heir).toBeNull();
  });
});
