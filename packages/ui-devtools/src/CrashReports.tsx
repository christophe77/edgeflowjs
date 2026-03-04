export type CrashEntry = {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  instanceId?: string;
};

export type CrashReportsProps = {
  crashes: CrashEntry[];
};

export function CrashReports({ crashes }: CrashReportsProps) {
  return (
    <div style={{ fontFamily: "system-ui", padding: "1rem", background: "#1a1a2e", borderRadius: "8px", color: "#eee" }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Crash Reports</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.8rem" }}>
        {crashes.map((c) => (
          <li
            key={c.id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #333",
              color: "#f87171",
            }}
          >
            <div style={{ marginBottom: "4px" }}>{c.message}</div>
            <div style={{ fontSize: "0.75rem", color: "#666" }}>
              {new Date(c.timestamp).toISOString()}
            </div>
            {c.stack && (
              <pre
                style={{
                  marginTop: "4px",
                  fontSize: "0.7rem",
                  overflow: "auto",
                  maxHeight: "80px",
                  background: "#16213e",
                  padding: "6px",
                  borderRadius: "4px",
                }}
              >
                {c.stack}
              </pre>
            )}
          </li>
        ))}
        {crashes.length === 0 && <li style={{ color: "#666" }}>No crash reports</li>}
      </ul>
    </div>
  );
}
