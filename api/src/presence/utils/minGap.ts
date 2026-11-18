/**
 * Lets an action through at most once per `gapMs` for each key (a room id, say).
 * In-memory and per process: it only sheds redundant work, so a second server
 * instance simply does a little more of it.
 */
export function minGap(gapMs: number, now: () => number = Date.now) {
  const last = new Map<string, number>();

  return function allow(key: string): boolean {
    const at = now();
    const previous = last.get(key);
    if (previous !== undefined && at - previous < gapMs) return false;

    // Forget keys whose window has long passed, so the map can't grow forever.
    if (last.size > 500) {
      for (const [k, t] of last) if (at - t >= gapMs) last.delete(k);
    }
    last.set(key, at);
    return true;
  };
}
