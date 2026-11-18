import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { config } from '../config.ts';
import { readUserId } from '../http/auth.ts';
import { resolveGroup } from './topics.ts';

// ---------------------------------------------------------------------------
// The realtime push channel, on Socket.IO. Clients only subscribe here; every
// change goes through the REST API, which keeps validation and authorisation
// in one place.
//
//   client → server   subscribe(topic, ack?)   ack(true) once joined, ack(false) for an unknown topic
//                     unsubscribe(topic)
//   server → client   room, members, message, history   (fresh state each time)
//
// A Socket.IO "room" is a group of connections; each topic maps to one
// (see topics.ts). Socket.IO handles heartbeats and reconnection.
// ---------------------------------------------------------------------------

export const REALTIME_PATH = '/realtime';

interface SocketData {
  userId: string;
}

type RealtimeServer = Server<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;
type RealtimeSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

let io: RealtimeServer | null = null;

/** Accepts a connection only with a valid bearer token in `auth.token`. */
function authenticate(socket: RealtimeSocket, next: (error?: Error) => void): void {
  const token: unknown = socket.handshake.auth?.token;
  const userId = typeof token === 'string' ? readUserId(token) : null;
  if (!userId) {
    next(new Error('Unauthorized'));
    return;
  }

  socket.data.userId = userId;
  next();
}

function onConnection(socket: RealtimeSocket): void {
  const { userId } = socket.data;

  socket.on('subscribe', (topic: unknown, acknowledge?: unknown) => {
    const group = resolveGroup(topic, userId);
    if (group) void socket.join(group);
    if (typeof acknowledge === 'function') acknowledge(group !== null);
  });

  socket.on('unsubscribe', (topic: unknown) => {
    const group = resolveGroup(topic, userId);
    if (group) void socket.leave(group);
  });
}

/** Serves the realtime channel on the same HTTP server as the API. */
export function attachRealtime(server: HttpServer): void {
  io = new Server(server, {
    path: REALTIME_PATH,
    // WebSockets only: a long-polling fallback would need sticky sessions behind a proxy.
    transports: ['websocket'],
    cors: { origin: config.corsOrigins },
  });
  io.use(authenticate);
  io.on('connection', onConnection);
}

/**
 * Pushes `payload` to every connection in any of `groups`. Socket.IO sends it
 * once to a connection that is in several of them.
 */
export function sendToGroups(groups: string[], event: string, payload: unknown): void {
  io?.to(groups).emit(event, payload);
}
