import { describe, expect, it, vi } from "vitest";

import { createChatSessionStore } from "./chat-session-store";

describe("conversation session identity", () => {
  it("preserves a streaming session when switching away and back", () => {
    const create = vi.fn((id: string) => ({ id, status: "ready" }));
    const store = createChatSessionStore(create);
    const first = store.ensure("first");
    first.status = "streaming";
    store.ensure("second");
    expect(store.ensure("first")).toBe(first);
    expect(store.get("first")?.status).toBe("streaming");
    expect(store.get("second")?.status).toBe("ready");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("notifies React with a new snapshot without changing prior snapshots", () => {
    const store = createChatSessionStore((id: string) => ({ id }));
    const initial = store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const session = store.ensure("first");
    const next = store.getSnapshot();
    expect(initial.size).toBe(0);
    expect(next).not.toBe(initial);
    expect(next.get("first")).toBe(session);
    store.ensure("first");
    expect(store.getSnapshot()).toBe(next);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.ensure("second");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
