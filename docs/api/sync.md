# Sync API

Offline-first outbox queue with SQLite persistence and retry. See [SYNC-DATA-MODEL.md](../SYNC-DATA-MODEL.md) for the schema.

## Install

```bash
pnpm add @edgeflowjs/sync
```

## Exports

```ts
import {
  createSqliteStore,
  createMemoryStore,
  createSyncEngine,
  type SyncStore,
  type SyncEngine,
  type OutboxEvent,
  type OutboxStatus,
} from "@edgeflowjs/sync";
```

## SyncStore

Low-level store interface. Use `createSqliteStore` for production, `createMemoryStore` for tests or when SQLite is unavailable.

```ts
const store = createSqliteStore("./data/edgeflow.sqlite");
// or
const store = createMemoryStore();
```

### OutboxEvent

```ts
type OutboxEvent = {
  id: string;
  type: string;
  payload: unknown;
  occurredAt: number;
  idempotencyKey: string;
  status: "pending" | "sent" | "failed";
  retryCount: number;
  nextRetryAt?: number;
  lastError?: string;
  traceId?: string;
};
```

### SyncStore Methods

- `outboxEnqueue(evt)` — Add event to queue
- `outboxList(filter?)` — List events by status/limit
- `outboxMarkSent(id)` — Mark as sent
- `outboxMarkFailed(id, err, nextRetryAt)` — Mark as failed, schedule retry
- `outboxDelete(id)` — Remove event
- `close()` — Close store

## SyncEngine

High-level engine with retry loop and stats.

```ts
const sync = createSyncEngine(store, {
  sinkUrl: "https://api.example.com/events",
  onPublish?: (stats) => void,
});

await sync.start();

await sync.enqueue("scan.completed", { code: "QR123" }, {
  idempotencyKey: "scan-abc-123",
  traceId: "trace-1",
});

const stats = await sync.stats(); // { pending, failed }
sync.onStats((s) => console.log(s));

await sync.retry();        // Retry all eligible
await sync.retry(["id1"]); // Retry specific IDs

await sync.stop();
```

## Full Interface Definitions

See [REPO.md](../REPO.md) section 2.5 for complete `SyncStore` and `SyncEngine` types.
