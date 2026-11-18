import { describe, expect, it } from 'vitest';
import { resolveGroup } from '../src/realtime/topics.ts';
import { createRoomBody } from '../src/rooms/services/createRoom.ts';
import { videoBody } from '../src/rooms/services/repointVideo.ts';
import { playbackBody } from '../src/rooms/services/writePlayback.ts';

const ROOM_ID = '0b5e3c1a-1f2d-4e5f-8a9b-0c1d2e3f4a5b';
const VERIFIER = { iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAA' };

const publicRoom = {
  name: '  ',
  pageUrl: 'https://videos.example.com/watch',
  selector: 'video',
  frameOrigin: '',
  currentTime: 0,
  visibility: 'public',
  chatKey: 'a2V5',
  chatSalt: null,
  chatCheck: null,
};

/** The messages zod reports for one field. */
function messagesFor(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  return (result.error?.issues ?? []).filter((issue) => issue.path.join('.') === field).map((issue) => issue.message);
}

describe('room request schemas', () => {
  it('names a blank room "Untitled room" and rejects an over-long name', () => {
    expect(createRoomBody.parse(publicRoom).name).toBe('Untitled room');
    const tooLong = createRoomBody.safeParse({ ...publicRoom, name: 'x'.repeat(121) });
    expect(messagesFor(tooLong, 'name')).toEqual(['Room names are at most 120 characters.']);
  });

  it('accepts only http(s) pages and bare origins for frames', () => {
    const video = { pageUrl: 'https://a.example', selector: 'video', currentTime: 1 };
    expect(videoBody.parse({ ...video, frameOrigin: 'https://player.example' }).frameOrigin).toBe('https://player.example');

    expect(videoBody.safeParse({ ...video, pageUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(videoBody.safeParse({ ...video, selector: '   ' }).success).toBe(false);
    expect(videoBody.safeParse({ ...video, frameOrigin: 'https://b.example/path' }).success).toBe(false);
  });

  it('bounds the playback rate and time', () => {
    expect(playbackBody.safeParse({ isPlaying: true, currentTime: 5, rate: 2 }).success).toBe(true);
    expect(playbackBody.safeParse({ isPlaying: true, currentTime: 5, rate: 0 }).success).toBe(false);
    expect(playbackBody.safeParse({ isPlaying: true, currentTime: -1, rate: 1 }).success).toBe(false);
  });

  it('never lets a private room store a key, or a public room carry private material', () => {
    const privateRoom = { ...publicRoom, visibility: 'private', chatKey: null, chatSalt: 'c2FsdA==', chatCheck: VERIFIER };
    expect(createRoomBody.parse(privateRoom).visibility).toBe('private');

    expect(createRoomBody.safeParse({ ...privateRoom, chatKey: 'a2V5' }).success).toBe(false);
    expect(createRoomBody.safeParse({ ...publicRoom, chatSalt: 'c2FsdA==' }).success).toBe(false);
    expect(createRoomBody.safeParse({ ...publicRoom, visibility: 'secret' }).success).toBe(false);
  });
});

describe('realtime topics', () => {
  it('maps history to the caller only, and rejects unknown topics', () => {
    expect(resolveGroup('history', 'user-1')).toBe('history:user-1');
    expect(resolveGroup('rooms', 'user-1')).toBe('rooms');
    expect(resolveGroup(`chat:${ROOM_ID}`, 'user-1')).toBe(`chat:${ROOM_ID}`);
    expect(resolveGroup('history:someone-else', 'user-1')).toBeNull();
    expect(resolveGroup('chat:not-a-uuid', 'user-1')).toBeNull();
    expect(resolveGroup(42, 'user-1')).toBeNull();
  });
});
