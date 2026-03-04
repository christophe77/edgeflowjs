export type AuditEntry = {
  at: number;
  sessionId: string;
  action: string;
  input?: unknown;
  outcome: "ok" | "error";
  error?: string;
};

const log: AuditEntry[] = [];

export function auditRecord(entry: AuditEntry): void {
  log.push(entry);
}

export function auditGetRecent(limit: number): AuditEntry[] {
  return log.slice(-limit);
}
