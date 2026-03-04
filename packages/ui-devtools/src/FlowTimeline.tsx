import type { FlowInstanceSnapshot } from "@edgeflow/flow";

export type TransitionEntry = {
  instanceId: string;
  from: string;
  to: string;
  eventType: string;
  ts?: number;
};

export type FlowTimelineProps = {
  transitions: TransitionEntry[];
  snapshot: FlowInstanceSnapshot<unknown> | null;
  instanceId?: string;
};

export function FlowTimeline({ transitions, snapshot, instanceId = "purchase-1" }: FlowTimelineProps) {
  const filtered = instanceId ? transitions.filter((t) => t.instanceId === instanceId) : transitions;
  const currentState = snapshot?.state ?? "—";

  return (
    <div style={{ fontFamily: "system-ui", padding: "1rem", background: "#1a1a2e", borderRadius: "8px", color: "#eee" }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Flow Timeline</h3>
      <div style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <strong>Current state:</strong> <code style={{ background: "#16213e", padding: "2px 6px", borderRadius: "4px" }}>{currentState}</code>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
        {filtered.slice(-20).reverse().map((t, i) => (
          <li key={i} style={{ padding: "4px 0", borderBottom: "1px solid #333" }}>
            <span style={{ color: "#888" }}>{t.from}</span> → <span style={{ color: "#6ee7b7" }}>{t.to}</span>
            <span style={{ color: "#666", marginLeft: "0.5rem" }}>({t.eventType})</span>
          </li>
        ))}
        {filtered.length === 0 && <li style={{ color: "#666" }}>No transitions yet</li>}
      </ul>
    </div>
  );
}
