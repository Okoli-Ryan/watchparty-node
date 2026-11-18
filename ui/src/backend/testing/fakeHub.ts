// A stand-in for socket.io-client's Socket, so the realtime layer can be tested
// without a server: tests push messages and simulate reconnects by hand.

type Handler = (...args: unknown[]) => void;

export class FakeSocket {
  connected = false;
  active = true;
  readonly emitted: Array<{ event: string; argument: unknown }> = [];
  private readonly handlers = new Map<string, Handler[]>();

  constructor() {
    // A real socket connects asynchronously; so does this one.
    setTimeout(() => this.simulateReconnect(), 0);
  }

  on(event: string, handler: Handler): this {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler]);
    return this;
  }

  emit(event: string, argument: unknown): this {
    this.emitted.push({ event, argument });
    return this;
  }

  connect(): this {
    return this;
  }

  disconnect(): this {
    this.connected = false;
    return this;
  }

  /** What the server would do: send `payload` to every `event` handler. */
  push(event: string, payload: unknown): void {
    for (const handler of this.handlers.get(event) ?? []) handler(payload);
  }

  /** What Socket.IO does when a (dropped) connection comes up: fire 'connect'. */
  simulateReconnect(): void {
    this.connected = true;
    this.push('connect', undefined);
  }

  subscribedTopics(): unknown[] {
    return this.emitted.filter((emitted) => emitted.event === 'subscribe').map((emitted) => emitted.argument);
  }
}

export const fakeHubs: FakeSocket[] = [];

/** The module factory for `vi.mock('socket.io-client', ...)`. */
export function fakeSocketIoModule() {
  return {
    io: () => {
      const socket = new FakeSocket();
      fakeHubs.push(socket);
      return socket;
    },
  };
}

/** Lets queued promise callbacks (fetches, emits) run before asserting. */
export async function settle(): Promise<void> {
  for (let round = 0; round < 10; round++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
