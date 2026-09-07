/** Session identity outlives navigation; snapshots change only when membership changes. */
export function createChatSessionStore<Session>(create: (id: string) => Session) {
  let snapshot: ReadonlyMap<string, Session> = new Map();
  const listeners = new Set<() => void>();
  const set = (id: string, session: Session) => {
    if (snapshot.get(id) === session) return;
    snapshot = new Map(snapshot).set(id, session);
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    get: (id: string) => snapshot.get(id),
    ensure: (id: string): Session => {
      if (snapshot.has(id)) return snapshot.get(id)!;
      const session = create(id);
      set(id, session);
      return session;
    },
    set,
  };
}
