import { bigint, boolean, doublePrecision, index, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// The whole database, as Drizzle tables. After changing this file, run
// `npm run db:generate -w @watchparty/api` to write a migration into
// api/drizzle/; the API applies pending migrations on start.
//
// Every time column is BIGINT epoch milliseconds of the SERVER clock: that is
// the form every DTO sends, so nothing converts between the two (DECISIONS.md #6).
// ---------------------------------------------------------------------------

/** Epoch milliseconds, read back as a JavaScript number. */
const epochMs = (name: string) => bigint(name, { mode: 'number' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(), // trimmed and lower-cased
  displayName: text('display_name').notNull(),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  passwordHash: text('password_hash').notNull(),
  createdAt: epochMs('created_at').notNull(),
});

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    pageUrl: text('page_url').notNull(),
    selector: text('selector').notNull(),
    frameOrigin: text('frame_origin').notNull().default(''),

    // Chat key material (DECISIONS.md #13). Public: chatKey. Private: salt + verifier.
    visibility: text('visibility').notNull().$type<'public' | 'private'>(),
    chatKey: text('chat_key').notNull().default(''),
    chatSalt: text('chat_salt').notNull().default(''),
    chatCheckIv: text('chat_check_iv'),
    chatCheckCt: text('chat_check_ct'),

    // Two ownership claims (DECISIONS.md #8): who hosts now, and who reclaims on return.
    ownerId: uuid('owner_id').notNull(),
    ownerName: text('owner_name').notNull(),
    primaryOwnerId: uuid('primary_owner_id').notNull(),
    primaryOwnerName: text('primary_owner_name').notNull(),

    isActive: boolean('is_active').notNull().default(true),

    // What the host last DID (play, pause, seek, rate). Viewers realign only on change.
    playbackIsPlaying: boolean('playback_is_playing').notNull(),
    playbackCurrentTime: doublePrecision('playback_current_time').notNull(),
    playbackRate: doublePrecision('playback_rate').notNull(),
    playbackUpdatedAt: epochMs('playback_updated_at'), // null until the host first acts
    playbackUpdatedBy: uuid('playback_updated_by').notNull(),

    // The host's live playhead, refreshed by the room heartbeat. Never part of playback.
    hostCurrentTime: doublePrecision('host_current_time'),
    hostIsPlaying: boolean('host_is_playing'),
    hostUpdatedAt: epochMs('host_updated_at'),

    lastActiveAt: epochMs('last_active_at').notNull(),
    createdAt: epochMs('created_at').notNull(),
  },
  (table) => [index('rooms_created_at').on(table.createdAt.desc())],
);

export const memberships = pgTable(
  'memberships',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role').notNull().$type<'owner' | 'viewer'>(),
    joinedAt: epochMs('joined_at').notNull(), // first join only: decides who inherits
    lastSeen: epochMs('last_seen').notNull(), // latest heartbeat
  },
  (table) => [primaryKey({ columns: [table.roomId, table.userId] })],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull(),
    senderName: text('sender_name').notNull(),
    // AES-GCM output from the client; the server never holds a key.
    iv: text('iv').notNull(),
    ct: text('ct').notNull(),
    sentAt: epochMs('sent_at').notNull(),
  },
  (table) => [index('chat_messages_room_sent').on(table.roomId, table.sentAt.desc())],
);

export const historyEntries = pgTable(
  'history_entries',
  {
    userId: uuid('user_id').notNull(),
    roomId: uuid('room_id').notNull(),
    // Copied from the room so the history list needs no join.
    roomName: text('room_name').notNull(),
    pageUrl: text('page_url').notNull(),
    roomCreatedAt: epochMs('room_created_at'),
    lastAttendedAt: epochMs('last_attended_at'), // null: only a read position, never joined
    isFavourite: boolean('is_favourite').notNull().default(false),
    lastReadAt: epochMs('last_read_at'), // newest chat message this user has seen
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roomId] }),
    index('history_entries_user_attended').on(table.userId, table.lastAttendedAt.desc()),
  ],
);
