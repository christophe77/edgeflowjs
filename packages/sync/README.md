# @edgeflowjs/sync

Offline-first outbox queue with SQLite persistence and retry.

## Install

```bash
pnpm add @edgeflowjs/sync
```

## Exports

- `createSqliteStore` — SQLite-backed store (production)
- `createMemoryStore` — In-memory store (tests, SQLite unavailable)
- `createSyncEngine` — High-level engine with retry loop
- `createSqliteCrashStore`, `createFileCrashStore` — Crash report persistence
- Types: `SyncStore`, `SyncEngine`, `OutboxEvent`, `OutboxStatus`, `CrashStore`

## Usage

```ts
import { createSqliteStore, createSyncEngine } from "@edgeflowjs/sync";

const store = createSqliteStore("./data/edgeflow.sqlite");
const sync = createSyncEngine(store, { sinkUrl: "https://api.example.com/events" });
await sync.start();

await sync.enqueue("scan.completed", { code: "QR123" }, { idempotencyKey: "scan-1" });
const stats = await sync.stats();
```

## Docs

- [API reference](../../docs/api/sync.md)
- [Sync data model](../../docs/SYNC-DATA-MODEL.md)
