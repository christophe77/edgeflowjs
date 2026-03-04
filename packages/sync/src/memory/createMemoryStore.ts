import type { OutboxEvent, SyncStore } from "../api/types.js";

const outbox: OutboxEvent[] = [];

export function createMemoryStore(): SyncStore {
  return {
    async outboxEnqueue(evt) {
      const row: OutboxEvent = {
        ...evt,
        id: evt.id ?? crypto.randomUUID(),
        status: "pending",
        retryCount: 0,
      };
      outbox.push(row);
      return row;
    },
    async outboxList(filter = {}) {
      const { status, limit = 100 } = filter;
      let list = [...outbox];
      if (status) list = list.filter((e) => e.status === status);
      list.sort((a, b) => a.occurredAt - b.occurredAt);
      return list.slice(0, limit);
    },
    async outboxMarkSent(id) {
      const e = outbox.find((x) => x.id === id);
      if (e) e.status = "sent";
    },
    async outboxMarkFailed(id, err, nextRetryAt) {
      const e = outbox.find((x) => x.id === id);
      if (e) {
        e.status = "failed";
        e.lastError = err;
        e.nextRetryAt = nextRetryAt;
        e.retryCount += 1;
      }
    },
    async outboxDelete(id) {
      const i = outbox.findIndex((x) => x.id === id);
      if (i >= 0) outbox.splice(i, 1);
    },
    async close() {},
  };
}
