import { useState, useEffect, useCallback } from "react";
import { createBridgeClient, type BridgeEvent } from "@edgeflow/bridge/client";
import { useT } from "@edgeflow/i18n/react";
import type { FlowInstanceSnapshot } from "@edgeflow/flow";
import type { OutboxEvent, CrashEntry } from "@edgeflow/ui-devtools";
import { FlowTimeline, OutboxInspector, CrashReports } from "@edgeflow/ui-devtools";

const url = import.meta.env.VITE_BRIDGE_URL ?? "ws://localhost:19707";
const bridge = createBridgeClient({ url });
const INSTANCE_ID = "purchase-1";

type TransitionEntry = { instanceId: string; from: string; to: string; eventType: string; ts?: number };

export default function App() {
  const t = useT();
  const [transitions, setTransitions] = useState<TransitionEntry[]>([]);
  const [snapshot, setSnapshot] = useState<FlowInstanceSnapshot<unknown> | null>(null);
  const [outbox, setOutbox] = useState<OutboxEvent[]>([]);
  const [stats, setStats] = useState<{ pending: number; failed: number }>({ pending: 0, failed: 0 });
  const [crashes, setCrashes] = useState<CrashEntry[]>([]);
  const [connected, setConnected] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    try {
      const data = await bridge.request({
        id: crypto.randomUUID(),
        type: "flow.getSnapshot",
        ts: Date.now(),
        payload: { instanceId: INSTANCE_ID },
      });
      setSnapshot(data as FlowInstanceSnapshot<unknown> | null);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  const fetchCrashes = useCallback(async () => {
    try {
      const data = await bridge.request({
        id: crypto.randomUUID(),
        type: "crash.list",
        ts: Date.now(),
        payload: { limit: 10 },
      });
      setCrashes((data as CrashEntry[]) ?? []);
    } catch {
      setCrashes([]);
    }
  }, []);

  const fetchOutbox = useCallback(async () => {
    try {
      const data = await bridge.request({
        id: crypto.randomUUID(),
        type: "sync.outbox.list",
        ts: Date.now(),
        payload: { limit: 50 },
      });
      const list = (data as OutboxEvent[]) ?? [];
      setOutbox(list);
      setStats({
        pending: list.filter((e) => e.status === "pending").length,
        failed: list.filter((e) => e.status === "failed").length,
      });
    } catch {
      setOutbox([]);
    }
  }, []);

  useEffect(() => {
    const handler = (evt: BridgeEvent) => {
      if (evt.type === "flow.transition" && evt.payload) {
        const p = evt.payload as TransitionEntry;
        setTransitions((prev) => [...prev, { ...p, ts: evt.ts ?? Date.now() }]);
      }
      if (evt.type === "sync.outbox.updated" && evt.payload) {
        setStats(evt.payload as { pending: number; failed: number });
        fetchOutbox();
      }
    };
    const unsub = bridge.subscribe(handler);
    return unsub;
  }, [fetchOutbox]);

  useEffect(() => {
    const t = setInterval(() => {
      fetchSnapshot();
      fetchOutbox();
      fetchCrashes();
    }, 1000);
    return () => clearInterval(t);
  }, [fetchSnapshot, fetchOutbox, fetchCrashes]);

  const handleRetry = useCallback(async (ids: string[]) => {
    try {
      await bridge.request({
        id: crypto.randomUUID(),
        type: "sync.outbox.retry",
        ts: Date.now(),
        payload: { ids },
      });
      fetchOutbox();
    } catch (e) {
      console.error("Retry failed", e);
    }
  }, [fetchOutbox]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{t("devtools.title")}</h1>
        <span style={{ fontSize: "0.85rem", color: connected ? "#6ee7b7" : "#f87171" }}>
          {connected ? t("devtools.connected") : t("devtools.connecting")}
        </span>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <FlowTimeline transitions={transitions} snapshot={snapshot} instanceId={INSTANCE_ID} />
        <OutboxInspector events={outbox} stats={stats} onRetry={handleRetry} />
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <CrashReports crashes={crashes} />
      </div>
    </div>
  );
}
