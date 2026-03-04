import Database from "better-sqlite3";
import type { OutboxStatus, SyncStore } from "../api/types.js";

export function createSqliteStore(dbPath: string): SyncStore {
  const db = new Database(dbPath);
  db.exec(`
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
  `);

  return {
    async outboxEnqueue(evt) {
      const id = evt.id ?? crypto.randomUUID();
      const row = {
        id,
        type: evt.type,
        payload: JSON.stringify(evt.payload ?? null),
        occurred_at: evt.occurredAt,
        idempotency_key: evt.idempotencyKey,
        status: "pending",
        retry_count: 0,
        next_retry_at: null,
        last_error: null,
        trace_id: evt.traceId ?? null,
      };
      const stmt = db.prepare(`
        INSERT INTO outbox_events (id, type, payload, occurred_at, idempotency_key, status, retry_count, next_retry_at, last_error, trace_id)
        VALUES (@id, @type, @payload, @occurred_at, @idempotency_key, @status, @retry_count, @next_retry_at, @last_error, @trace_id)
      `);
      stmt.run(row);
      return {
        id: row.id,
        type: row.type,
        payload: evt.payload,
        occurredAt: row.occurred_at,
        idempotencyKey: row.idempotency_key,
        status: "pending",
        retryCount: 0,
        traceId: evt.traceId,
      };
    },
    async outboxList(filter = {}) {
      const { status, limit = 100 } = filter;
      let sql = "SELECT * FROM outbox_events";
      const params: Record<string, unknown> = {};
      if (status) {
        sql += " WHERE status = @status";
        params.status = status;
      }
      sql += " ORDER BY occurred_at ASC LIMIT @limit";
      params.limit = limit;
      const stmt = db.prepare(sql);
      const rows = stmt.all(params) as Array<{
        id: string;
        type: string;
        payload: string;
        occurred_at: number;
        idempotency_key: string;
        status: string;
        retry_count: number;
        next_retry_at: number | null;
        last_error: string | null;
        trace_id: string | null;
      }>;
      return rows.map((r) => ({
        id: r.id,
        type: r.type,
        payload: r.payload ? JSON.parse(r.payload) : null,
        occurredAt: r.occurred_at,
        idempotencyKey: r.idempotency_key,
        status: r.status as OutboxStatus,
        retryCount: r.retry_count,
        nextRetryAt: r.next_retry_at ?? undefined,
        lastError: r.last_error ?? undefined,
        traceId: r.trace_id ?? undefined,
      }));
    },
    async outboxMarkSent(id) {
      db.prepare("UPDATE outbox_events SET status = 'sent' WHERE id = ?").run(id);
    },
    async outboxMarkFailed(id, err, nextRetryAt) {
      db.prepare(
        "UPDATE outbox_events SET status = 'failed', last_error = ?, next_retry_at = ?, retry_count = retry_count + 1 WHERE id = ?"
      ).run(err, nextRetryAt, id);
    },
    async outboxDelete(id) {
      db.prepare("DELETE FROM outbox_events WHERE id = ?").run(id);
    },
    async close() {
      db.close();
    },
  };
}
