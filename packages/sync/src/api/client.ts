import type { OutboxEvent, SyncEngine, SyncStore } from "./types.js";

const statsHandlers: Array<(s: { pending: number; failed: number }) => void> = [];
let retryTimer: ReturnType<typeof setInterval> | null = null;

function nextRetryDelay(retryCount: number): number {
  const base = 1000;
  const max = 60_000;
  const withJitter = base * Math.pow(2, retryCount) + Math.random() * 1000;
  return Math.min(max, withJitter);
}

export function createSyncEngine(
  store: SyncStore,
  engineOpts: {
    sinkUrl?: string;
    onPublish?: (stats: { pending: number; failed: number }) => void;
  } = {}
): SyncEngine {
  const onPublishCb = engineOpts.onPublish;
  async function doRetry(ids?: string[]) {
    const list = ids
      ? await Promise.all(ids.map(async (id) => (await store.outboxList({ limit: 1000 })).find((e) => e.id === id)))
      : await store.outboxList({ status: "pending", limit: 50 });
    const events = (ids ? list.filter(Boolean) : list) as OutboxEvent[];
    const now = Date.now();
    const toRetry = events.filter((e) => e.status === "pending" || (e.nextRetryAt != null && e.nextRetryAt <= now));
    for (const evt of toRetry) {
      try {
        if (engineOpts.sinkUrl) {
          const res = await fetch(engineOpts.sinkUrl!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: evt.type, payload: evt.payload, idempotencyKey: evt.idempotencyKey }),
          });
          if (res.ok) {
            await store.outboxMarkSent(evt.id);
          } else {
            const next = Date.now() + nextRetryDelay(evt.retryCount);
            await store.outboxMarkFailed(evt.id, `HTTP ${res.status}`, next);
          }
        } else {
          await store.outboxMarkFailed(evt.id, "No sink URL", Date.now() + nextRetryDelay(evt.retryCount));
        }
      } catch (err) {
        const next = Date.now() + nextRetryDelay(evt.retryCount);
        await store.outboxMarkFailed(evt.id, String(err), next);
      }
    }
    const s = await stats();
    for (const h of statsHandlers) h(s);
    if (onPublishCb) onPublishCb(s);
  }

  async function stats() {
    const [pending, failed] = await Promise.all([
      store.outboxList({ status: "pending", limit: 10000 }).then((r) => r.length),
      store.outboxList({ status: "failed", limit: 10000 }).then((r) => r.length),
    ]);
    return { pending, failed };
  }

  return {
    async start() {
      retryTimer = setInterval(() => doRetry(), 5000);
      await doRetry();
    },
    async stop() {
      if (retryTimer) clearInterval(retryTimer);
      retryTimer = null;
    },
    async enqueue(type, payload, opts) {
      const evt = await store.outboxEnqueue({
        id: crypto.randomUUID(),
        type,
        payload,
        occurredAt: Date.now(),
        idempotencyKey: opts.idempotencyKey,
        traceId: opts.traceId,
      });
      const s = await stats();
      for (const h of statsHandlers) h(s);
      if (onPublishCb) onPublishCb(s);
      return evt;
    },
    stats,
    async retry(ids) {
      await doRetry(ids);
    },
    onStats(handler) {
      statsHandlers.push(handler);
      return () => {
        const i = statsHandlers.indexOf(handler);
        if (i >= 0) statsHandlers.splice(i, 1);
      };
    },
  };
}
