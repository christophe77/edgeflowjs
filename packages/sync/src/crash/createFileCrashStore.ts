import fs from "node:fs";
import path from "node:path";
import type { CrashStore, CrashReportEntry } from "./types.js";

export function createFileCrashStore(filePath: string): CrashStore {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  function load(): CrashReportEntry[] {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function save(entries: CrashReportEntry[]) {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), "utf-8");
  }

  return {
    async report(evt) {
      const entries = load();
      entries.unshift({
        id: crypto.randomUUID(),
        message: evt.message,
        stack: evt.stack,
        timestamp: evt.timestamp ?? Date.now(),
        instanceId: evt.instanceId,
      });
      save(entries.slice(0, 100));
    },
    async list(limit = 20) {
      return load().slice(0, limit);
    },
  };
}
