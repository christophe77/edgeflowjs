# Sync Engine — Data Model

This document formalizes the persistence schema and conventions of the Sync engine.

---

## 1. SQLite Tables

### 1.1 outbox_events (MVP)

Main table for the outbox pattern. Implemented in `packages/sync/src/sqlite/createSqliteStore.ts`.

```sql
CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT,
  occurred_at INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  last_error TEXT,
  trace_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status);
CREATE INDEX IF NOT EXISTS idx_outbox_next_retry ON outbox_events(next_retry_at);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | UUID, primary key |
| `type` | TEXT | Event type (e.g. `scan.completed`, `purchase.recorded`) |
| `payload` | TEXT | Serialized JSON payload |
| `occurred_at` | INTEGER | Epoch ms |
| `idempotency_key` | TEXT | Stable deduplication key per physical event |
| `status` | TEXT | `pending` \| `sent` \| `failed` |
| `retry_count` | INTEGER | Number of attempts |
| `next_retry_at` | INTEGER | Epoch ms for next attempt (if failed) |
| `last_error` | TEXT | Last error message |
| `trace_id` | TEXT | Optional trace ID |

---

### 1.2 entities_cache (V2)

Local cache of synchronized entities. Not implemented in MVP.

```sql
CREATE TABLE IF NOT EXISTS entities_cache (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
```

---

### 1.3 sync_state (V2)

Sync state (watermarks, cursors). Not implemented in MVP.

```sql
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER NOT NULL
);
```

---

### 1.4 audit_log (V2)

Audit of maintenance actions. May be implemented in `@edgeflowjs/maintenance`.

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  session_id TEXT NOT NULL,
  payload TEXT,
  ts INTEGER NOT NULL
);
```

---

### 1.5 crash_reports (V2)

Crash reports. Not implemented in MVP.

```sql
CREATE TABLE IF NOT EXISTS crash_reports (
  id TEXT PRIMARY KEY,
  payload TEXT,
  ts INTEGER NOT NULL
);
```

---

## 2. Outbox envelope

TypeScript format:

```ts
type OutboxEvent = {
  id: string;           // uuid
  type: string;
  payload: unknown;
  occurredAt: number;   // epoch ms
  idempotencyKey: string;
  status: "pending" | "sent" | "failed";
  retryCount: number;
  nextRetryAt?: number;
  lastError?: string;
  traceId?: string;
};
```

**Rules:**

- `idempotencyKey`: stable per physical event (e.g. `scan-{instanceId}-{timestamp}`)
- `payload`: serializable JSON object
- `traceId`: propagation for log/trace correlation

---

## 3. Retry policy

Implemented in `packages/sync/src/api/client.ts`.

- **Formula:** `delay = min(60_000, 1000 * 2^retryCount + jitter)` with jitter = 0–1000 ms
- **Polling interval:** 5 s
- **Retry criteria:** `status === "pending"` or `nextRetryAt <= now` for failed
- **Deduplication:** `idempotencyKey` on sink side (backend responsibility)

---

## 4. Sink (endpoint)

MVP: configurable POST to a URL.

```ts
createSyncEngine(store, { sinkUrl: "https://api.example.com/events" });
```

Request body:

```json
{
  "type": "scan.completed",
  "payload": { "code": "QR123", "instanceId": "..." },
  "idempotencyKey": "scan-abc-1234567890"
}
```

The sink must accept or reject (4xx/5xx). On success (2xx), the event is marked `sent`.
