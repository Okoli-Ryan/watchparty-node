import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL, REALTIME_PATH } from './config';
import { onSessionChange, readSession } from './session';

// ---------------------------------------------------------------------------
// The push channel that replaces Firestore's onSnapshot, over Socket.IO.
//
// The API sends four kinds of message, each carrying fresh state:
//   room     a RoomDto             (to `room:{id}` and to `rooms`)
//   members  a members snapshot    (to `members:{id}`)
//   message  a chat message        (to `chat:{id}`)
//   history  a history change      (to `history`, the caller's own)
//
// A live query subscribes to its topic, then loads the current state over
// REST, then applies pushes on top. After any reconnect it does both again
// from scratch: a push lost while disconnected is never relied on
// (DECISIONS.md #21).
// ---------------------------------------------------------------------------

export type Unsubscribe = () => void;

interface LiveQueryOptions<TState, TPush> {
  topic: string;
  event: 'room' | 'members' | 'message' | 'history';
  /** Fetches the complete current state. */
  load: () => Promise<TState>;
  /** Folds one push into the state; return undefined to ignore it. */
  applyPush: (current: TState, push: TPush) => TState | undefined;
  /** Receives every new state. */
  emit: (state: TState) => void;
  onError?: (error: Error) => void;
}

interface Subscription {
  topic: string;
  event: string;
  receivePush: (push: unknown) => void;
  reload: () => void;
}

/** After a refused connection (a bad or missing token), try again this much later. */
const RETRY_REFUSED_MS = 5_000;

const subscriptions = new Set<Subscription>();
let socket: Socket | null = null;

/** Joins the topic's group on the server, then loads fresh state over REST. */
function subscribeAndReload(subscription: Subscription): void {
  socket?.emit('subscribe', subscription.topic);
  subscription.reload();
}

function createSocket(): Socket {
  const created = io(API_BASE_URL, {
    path: REALTIME_PATH,
    // WebSockets only: an MV3 service worker has no XHR for long-polling.
    transports: ['websocket'],
    // Called on every (re)connect, so a refreshed token is always the one sent.
    auth: (sendAuth) => {
      void readSession().then((session) => sendAuth({ token: session?.accessToken ?? '' }));
    },
    // Reconnect forever, backing off to 30s: a watch party can outlast any outage.
    reconnectionDelayMax: 30_000,
  });

  for (const event of ['room', 'members', 'message', 'history']) {
    created.on(event, (push: unknown) => {
      for (const subscription of subscriptions) {
        if (subscription.event === event) subscription.receivePush(push);
      }
    });
  }

  // Fires on the first connect and after every reconnect. The server forgets a
  // connection's subscriptions when it drops, so every topic is joined again.
  created.on('connect', () => {
    for (const subscription of subscriptions) subscribeAndReload(subscription);
  });

  // A connection the server refused (signed out, expired token) is not retried
  // by Socket.IO itself; try again shortly, as the token may have been renewed.
  created.on('connect_error', () => {
    if (!created.active) setTimeout(() => created === socket && created.connect(), RETRY_REFUSED_MS);
  });

  return created;
}

function ensureSocket(): Socket {
  socket ??= createSocket();
  return socket;
}

/** A different user, or nobody: drop the connection so the next one carries the right token. */
onSessionChange(() => {
  socket?.disconnect();
  socket = null;
  if (subscriptions.size > 0) ensureSocket();
});

/**
 * Subscribe to a piece of live state. Returns a function that stops it, like
 * Firestore's onSnapshot did.
 */
export function liveQuery<TState, TPush>(options: LiveQueryOptions<TState, TPush>): Unsubscribe {
  let state: TState | undefined;
  let loaded = false;
  let stopped = false;
  let loadSequence = 0;
  const earlyPushes: TPush[] = [];

  const reload = () => {
    const sequence = ++loadSequence;
    options
      .load()
      .then((fresh) => {
        // A newer reload already started: this answer is out of date.
        if (stopped || sequence !== loadSequence) return;

        state = fresh;
        loaded = true;
        for (const push of earlyPushes.splice(0)) {
          state = options.applyPush(state, push) ?? state;
        }
        options.emit(state);
      })
      .catch((error: Error) => options.onError?.(error));
  };

  const subscription: Subscription = {
    topic: options.topic,
    event: options.event,
    receivePush: (push) => {
      if (stopped) return;
      if (!loaded || state === undefined) {
        earlyPushes.push(push as TPush);
        return;
      }

      const next = options.applyPush(state, push as TPush);
      if (next === undefined) return;
      state = next;
      options.emit(state);
    },
    reload,
  };

  subscriptions.add(subscription);

  // Already connected: start now. Otherwise the 'connect' handler starts it.
  if (ensureSocket().connected) subscribeAndReload(subscription);

  return () => {
    stopped = true;
    subscriptions.delete(subscription);

    const topicStillWanted = [...subscriptions].some((other) => other.topic === options.topic);
    if (!topicStillWanted && socket?.connected) socket.emit('unsubscribe', options.topic);
  };
}
