import Database from "better-sqlite3";
import type { CrashStore } from "./types.js";

export function createSqliteCrashStore(dbPath: string): CrashStore {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS crash_reports (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_crash_ts ON crash_reports(ts);
  `);

  return {
    async report(evt) {
      const id = crypto.randomUUID();
      const payload = JSON.stringify({
        message: evt.message,
        stack: evt.stack,
        instanceId: evt.instanceId,
      });
      const ts = evt.timestamp ?? Date.now();
      db.prepare("INSERT INTO crash_reports (id, payload, ts) VALUES (?, ?, ?)").run(id, payload, ts);
    },
    async list(limit = 20) {
      const rows = db
        .prepare("SELECT id, payload, ts FROM crash_reports ORDER BY ts DESC LIMIT ?")
        .all(limit) as Array<{ id: string; payload: string; ts: number }>;
      return rows.map((r) => {
        const p = JSON.parse(r.payload) as { message: string; stack?: string; instanceId?: string };
        return { id: r.id, message: p.message, stack: p.stack, timestamp: r.ts, instanceId: p.instanceId };
      });
    },
  };
}
