import type { FlowInstanceSnapshot } from "./types.js";

export type FlowStore = {
  load(instanceId: string): Promise<FlowInstanceSnapshot<unknown> | null>;
  save(snapshot: FlowInstanceSnapshot<unknown>): Promise<void>;
};

export function createMemoryFlowStore(): FlowStore {
  const memory = new Map<string, FlowInstanceSnapshot<unknown>>();
  return {
    async load(instanceId) {
      return memory.get(instanceId) ?? null;
    },
    async save(snapshot) {
      memory.set(snapshot.instanceId, snapshot);
    },
  };
}
