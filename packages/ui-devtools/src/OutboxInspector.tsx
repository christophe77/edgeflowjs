export type OutboxEvent = {
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

export type OutboxInspectorProps = {
  events: OutboxEvent[];
  stats?: { pending: number; failed: number };
  onRetry?: (ids: string[]) => void;
};

export function OutboxInspector({ events, stats, onRetry }: OutboxInspectorProps) {
  const failed = events.filter((e) => e.status === "failed");

  return (
    <div style={{ fontFamily: "system-ui", padding: "1rem", background: "#1a1a2e", borderRadius: "8px", color: "#eee" }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Outbox</h3>
      {stats && (
        <div style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
          <span style={{ color: "#fbbf24" }}>Pending: {stats.pending}</span>
          <span style={{ marginLeft: "1rem", color: "#f87171" }}>Failed: {stats.failed}</span>
        </div>
      )}
      {failed.length > 0 && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(failed.map((e) => e.id))}
          style={{
            marginBottom: "1rem",
            padding: "6px 12px",
            background: "#4361ee",
            border: "none",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Retry failed
        </button>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.8rem" }}>
        {events.slice(0, 30).map((e) => (
          <li
            key={e.id}
            style={{
              padding: "6px 0",
              borderBottom: "1px solid #333",
              color: e.status === "failed" ? "#f87171" : e.status === "pending" ? "#fbbf24" : "#888",
            }}
          >
            <code style={{ background: "#16213e", padding: "2px 4px", borderRadius: "4px" }}>{e.type}</code>
            <span style={{ marginLeft: "0.5rem" }}>{e.status}</span>
            {e.lastError && <span style={{ marginLeft: "0.5rem", color: "#666" }}>— {e.lastError}</span>}
          </li>
        ))}
        {events.length === 0 && <li style={{ color: "#666" }}>No outbox events</li>}
      </ul>
    </div>
  );
}
