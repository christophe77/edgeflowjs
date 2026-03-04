import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStore, createSyncEngine } from "./index.js";

describe("Sync engine", () => {
  let store: ReturnType<typeof createMemoryStore>;
  let engine: ReturnType<typeof createSyncEngine>;

  beforeEach(() => {
    store = createMemoryStore();
    engine = createSyncEngine(store);
  });

  it("enqueues events", async () => {
    const evt = await engine.enqueue("TestEvent", { foo: "bar" }, { idempotencyKey: "key-1" });
    expect(evt.type).toBe("TestEvent");
    expect(evt.payload).toEqual({ foo: "bar" });
    expect(evt.idempotencyKey).toBe("key-1");
    expect(evt.status).toBe("pending");
    expect(evt.id).toBeDefined();
  });

  it("lists outbox events", async () => {
    await engine.enqueue("E1", {}, { idempotencyKey: "k1" });
    await engine.enqueue("E2", {}, { idempotencyKey: "k2" });
    const list = await store.outboxList({ limit: 10 });
    expect(list).toHaveLength(2);
    expect(list[0].type).toBe("E1");
    expect(list[1].type).toBe("E2");
  });

  it("marks event as sent", async () => {
    const evt = await engine.enqueue("E1", {}, { idempotencyKey: "k1" });
    await store.outboxMarkSent(evt.id);
    const list = await store.outboxList({ status: "sent", limit: 10 });
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("sent");
  });

  it("marks event as failed", async () => {
    const evt = await engine.enqueue("E1", {}, { idempotencyKey: "k1" });
    await store.outboxMarkFailed(evt.id, "Network error", Date.now() + 5000);
    const list = await store.outboxList({ status: "failed", limit: 10 });
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("failed");
    expect(list[0].lastError).toBe("Network error");
  });

  it("returns stats", async () => {
    await engine.enqueue("E1", {}, { idempotencyKey: "k1" });
    const s = await engine.stats();
    expect(s.pending).toBe(1);
    expect(s.failed).toBe(0);
  });
});
