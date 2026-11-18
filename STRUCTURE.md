# Code structure

WatchParty is a browser extension that keeps an HTML5 video in sync across
viewers. This repository is an npm workspaces monorepo with two packages, plus
the marketing site kept beside them:

```
watchparty-node/
├── package.json          workspaces: api, ui. Root scripts delegate to them.
├── STRUCTURE.md          this file
├── DECISIONS.md          why the odd-looking parts are the way they are (numbered, cited in code)
│
├── api/                  @watchparty/api: the backend (Express, Postgres via Drizzle, Socket.IO)
│   ├── compose.yaml      local Postgres for development
│   ├── .env.example      every setting the API reads
│   ├── drizzle.config.ts drizzle-kit settings
│   ├── drizzle/          generated SQL migrations, applied on start
│   ├── src/
│   │   ├── server.ts     entry point: run migrations, build the app, attach realtime, listen
│   │   ├── app.ts        the Express app: middleware, routes, error handler
│   │   ├── config.ts     environment variables, checked once with zod
│   │   ├── logger.ts     the pino logger
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts     every table and index, as Drizzle tables
│   │   │   └── database.ts   the pg pool, the Drizzle client, runMigrations()
│   │   │
│   │   ├── http/             cross-cutting HTTP concerns
│   │   │   ├── errors.ts     ApiError + every state error the API can return (code, status, message)
│   │   │   ├── problem.ts    turns ApiError, ZodError or anything else into Problem Details
│   │   │   ├── auth.ts       issuing and checking bearer tokens (JWT), requireAuth middleware
│   │   │   ├── security.ts   helmet, CORS, rate limits
│   │   │   └── input.ts      shared zod pieces: UUID route params, page limits
│   │   │
│   │   ├── identity/         accounts (the reference for every feature folder, see below)
│   │   │   ├── routes.ts         /auth/login → login, /auth/register → signUp, /me → getMyProfile
│   │   │   ├── types.ts          User, UserProfileDto
│   │   │   ├── services/         login.ts, signUp.ts, getMyProfile.ts
│   │   │   ├── repository/       findUserById.ts, findUserByEmail.ts, insertUser.ts
│   │   │   └── utils/            toProfile.ts, sessionFor.ts, passwords.ts (scrypt)
│   │   │
│   │   ├── rooms/            rooms and the host's controls
│   │   │   ├── routes.ts         /rooms…
│   │   │   ├── types.ts          Room, RoomDto, VideoSource, ChatProtection
│   │   │   ├── services/         listRooms, getRoom, createRoom, writePlayback, touchRoom,
│   │   │   │                     repointVideo, transferOwnership, changeRoomAsHost (shared step)
│   │   │   ├── repository/       findRoom, listRecentRooms, lockRoom, insertRoom, updatePlayback,
│   │   │   │                     updateLiveness, updateVideo, updateOwner, markRoomInactive
│   │   │   └── utils/            toRoomDto, ensureHost, schemas (shared zod field rules)
│   │   │
│   │   ├── presence/         who is in a room, and who hosts it
│   │   │   ├── routes.ts         /rooms/:id/members…
│   │   │   ├── types.ts          Member, MemberRole
│   │   │   ├── services/         getMembers, joinRoom, heartbeat, leaveRoom,
│   │   │   │                     enterRoom + reconcileRoom (shared steps)
│   │   │   ├── repository/       listMembers, findMember, upsertMembership, recordBeat, removeMembers
│   │   │   └── utils/            succession (pure, unit tested), toMembersSnapshot
│   │   │
│   │   ├── chat/             /rooms/:id/messages (ciphertext only; the server holds no key)
│   │   │   ├── routes.ts
│   │   │   ├── services/         listMessages, postMessage
│   │   │   ├── repository/       listRecentMessages, findMessage, insertMessage
│   │   │   └── utils/            messageColumns
│   │   │
│   │   ├── history/          each user's own room history, favourites and read position
│   │   │   ├── routes.ts         /me/history…
│   │   │   ├── services/         listHistory, getHistoryEntry, setFavourite, markRead, removeFromHistory
│   │   │   ├── repository/       listAttended, findEntry, upsertAttendance, advanceReadPosition,
│   │   │   │                     updateFavourite, deleteEntry
│   │   │   └── utils/            entryColumns, roomSnapshot, isEntry
│   │   │
│   │   └── realtime/         the push channel the extension subscribes to
│   │       ├── socket.ts     the Socket.IO server: token check, subscribe / unsubscribe
│   │       ├── topics.ts     which topics a caller may subscribe to, and the room behind each
│   │       └── notify.ts     "X changed" → read fresh state once → push it to subscribers
│   │
│   └── test/                 Vitest: pure logic, zod schemas, and the HTTP pipeline via supertest
│
├── ui/                   @watchparty/ui: the browser extension and the web dashboard
│   ├── manifest.config.ts    MV3 manifest
│   ├── src/
│   │   ├── shared/       the contract between contexts (messages.ts), types, crypto
│   │   ├── backend/      data layer: REST client, Socket.IO live queries (realtime.ts), session
│   │   ├── background/   service worker: all API and realtime work
│   │   ├── content/      picker, video controller, floating widget
│   │   ├── popup/        sign-in, room list, create room
│   │   └── dashboard/    the extension's full-page dashboard
│   ├── web/              the web dashboard: a plain SPA built from the same sources
│   ├── tests/e2e/        the real client modules against a running API
│   └── scripts/          Firefox manifest rewrite, zip packaging
│
└── landing/              the marketing site (Next.js, its own package; not a workspace)
```

## Inside a feature folder

Every feature (identity, rooms, presence, chat, history) has the same shape,
one exported function per file:

| Part | Holds | Rules |
|---|---|---|
| `routes.ts` | the endpoint → service mapping, and nothing else | no logic; middleware such as a rate limit may sit in the mapping |
| `services/` | one file per endpoint: parse input with zod, do the work, reply | may call any repository; `notify.*` after a commit. A few are shared steps used by other services (`changeRoomAsHost`, `enterRoom`, `reconcileRoom`) |
| `repository/` | one file per query or write | takes a `db` (or transaction) as its first argument; only Drizzle, no HTTP, no decisions |
| `utils/` | pure helpers: DTO mapping, shared zod rules, column lists | no database access |
| `types.ts` | the feature's types | |

Features may use each other's repositories and utils (presence's `enterRoom`
locks a room through `rooms/repository/lockRoom.ts`), never each other's services.

## How a request flows

1. A client (extension service worker or web dashboard) calls `/api/v1/...` with
   `Authorization: Bearer <token>`.
2. `app.ts` logs it (pino-http), applies helmet headers, CORS, then
   `requireAuth` and the per-user rate limit.
3. The feature's `routes.ts` hands the request to its service, which parses
   its input with a zod schema (`schema.parse(...)`), then calls repository
   functions. Writes that must be atomic run inside
   `db.transaction()` and lock the room row (`.for('update')`), so two writers
   never interleave.
4. After the transaction commits, the handler calls `notify.*`. Notifications
   are de-duplicated per tick, then `notify.ts` reads the fresh state once and
   pushes it with Socket.IO to every subscribed connection.
5. Anything thrown becomes a Problem Details reply in `problem.ts`: an
   `ApiError` keeps its code (for example `Room.NotOwner`), a `ZodError` becomes
   `Validation.Failed` with a message per field.

## Realtime

Socket.IO on path `/realtime`, WebSockets only. The client sends its token as
`auth: { token }`; the server refuses the connection without a valid one.

| Client emits | Server does |
|---|---|
| `subscribe(topic, ack?)` | joins the topic's room; `ack(true)`, or `ack(false)` for an unknown topic |
| `unsubscribe(topic)` | leaves it |

The server emits `room`, `members`, `message` and `history`, each carrying fresh
state. Topics: `rooms`, `history` (always the caller's own), `room:<id>`,
`members:<id>`, `chat:<id>`. After every (re)connect the client subscribes
again and reloads over REST.

## Changing the database

Edit `api/src/db/schema.ts`, then:

```
npm run db:generate -w @watchparty/api    # writes a new migration into api/drizzle/
```

The API applies pending migrations when it starts.

## Running it

```
npm install
docker compose -f api/compose.yaml up -d      # Postgres on :5432
cp api/.env.example api/.env                  # set JWT_SECRET
npm run dev:api                               # API on http://localhost:5080
npm test                                      # API and ui unit tests
npm run build -w @watchparty/ui               # then load ui/dist unpacked
```

End-to-end (needs the API running and two registered accounts):

```
E2E_HOST_EMAIL=… E2E_VIEWER_EMAIL=… E2E_PASSWORD=… npm run test:e2e
```
