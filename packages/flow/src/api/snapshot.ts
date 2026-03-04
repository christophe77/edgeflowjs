import type { FlowInstanceSnapshot } from "./types.js";

export function exportSnapshot<TCtx>(snapshot: FlowInstanceSnapshot<TCtx>): string {
  return JSON.stringify(
    {
      instanceId: snapshot.instanceId,
      flowId: snapshot.flowId,
      state: snapshot.state,
      ctx: snapshot.ctx,
      updatedAt: snapshot.updatedAt,
    },
    null,
    2
  );
}
