import { createBridgeClient, type BridgeEvent } from "@edgeflow/bridge/client";
import type { FlowInstanceSnapshot } from "@edgeflow/flow";

const url = import.meta.env.VITE_BRIDGE_URL ?? "ws://localhost:19707";
export const bridgeClient = createBridgeClient({ url });

export async function getSnapshot(instanceId: string): Promise<FlowInstanceSnapshot<unknown> | null> {
  try {
    const data = await bridgeClient.request({
      id: crypto.randomUUID(),
      type: "flow.getSnapshot",
      ts: Date.now(),
      payload: { instanceId },
    });
    return data as FlowInstanceSnapshot<unknown> | null;
  } catch {
    return null;
  }
}

export async function dispatch(instanceId: string, event: { type: string; payload?: unknown }): Promise<FlowInstanceSnapshot<unknown>> {
  const data = await bridgeClient.request({
    id: crypto.randomUUID(),
    type: "flow.dispatch",
    ts: Date.now(),
    payload: { instanceId, event },
  });
  return data as FlowInstanceSnapshot<unknown>;
}

const flowSubs: Array<(t: { instanceId: string; from: string; to: string; eventType: string }) => void> = [];

bridgeClient.subscribe((evt: BridgeEvent) => {
  if (evt.type === "flow.transition" && evt.payload) {
    const p = evt.payload as { instanceId: string; from: string; to: string; eventType: string };
    for (const sub of flowSubs) {
      sub({ instanceId: p.instanceId, from: p.from, to: p.to, eventType: p.eventType });
    }
  }
});

export function subscribeFlow(handler: (t: { instanceId: string; from: string; to: string; eventType: string }) => void): () => void {
  flowSubs.push(handler);
  return () => {
    const i = flowSubs.indexOf(handler);
    if (i >= 0) flowSubs.splice(i, 1);
  };
}
