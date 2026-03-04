import type {
  FlowDef,
  FlowEvent,
  FlowInstanceSnapshot,
  FlowStateDef,
} from "./types.js";
import type { FlowStore } from "./store.js";

/**
 * Flow engine: registers flows, starts instances, dispatches events, persists snapshots.
 * Use onTransition() to publish flow.transition events to the bridge.
 */
export type FlowEngine = {
  /** Register a flow definition. Must be called before start(). */
  register<TCtx>(def: FlowDef<TCtx>): void;
  /** Start a new flow instance. Persists initial snapshot. */
  start<TCtx>(flowId: string, opts: { instanceId: string; ctx: TCtx }): Promise<FlowInstanceSnapshot<TCtx>>;
  /** Dispatch an event to an instance. Loads snapshot, runs transition, saves. */
  dispatch(instanceId: string, evt: FlowEvent): Promise<FlowInstanceSnapshot<unknown>>;
  /** Load current snapshot for an instance, or null if not found. */
  getSnapshot(instanceId: string): Promise<FlowInstanceSnapshot<unknown> | null>;
  /** Subscribe to transitions. Returns unsubscribe function. */
  onTransition(
    handler: (t: { instanceId: string; from: string; to: string; event: FlowEvent }) => void
  ): () => void;
};

type TransitionSub = (t: { instanceId: string; from: string; to: string; event: FlowEvent }) => void;
const transitionHandlers: TransitionSub[] = [];

function resolveTarget(stateDef: FlowStateDef<unknown>, eventType: string): string | null {
  const on = stateDef.on?.[eventType];
  if (typeof on === "string") return on;
  if (on && typeof on === "object" && "target" in on) return on.target;
  return null;
}

export function createFlowEngine(store: FlowStore): FlowEngine {
  const defs = new Map<string, FlowDef<unknown>>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  async function runTransition(
    snapshot: FlowInstanceSnapshot<unknown>,
    eventType: string,
    payload?: unknown
  ): Promise<FlowInstanceSnapshot<unknown>> {
    const existingTimer = timers.get(snapshot.instanceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timers.delete(snapshot.instanceId);
    }
    const def = defs.get(snapshot.flowId);
    if (!def) throw new Error(`Flow ${snapshot.flowId} not registered`);
    const stateDef = def.states[snapshot.state] as FlowStateDef<unknown> | undefined;
    if (!stateDef) throw new Error(`Unknown state ${snapshot.state}`);
    const target = resolveTarget(stateDef, eventType);
    if (!target || !def.states[target]) throw new Error(`No transition for ${eventType} to ${target}`);

    const from = snapshot.state;
    const evt: FlowEvent = { type: eventType, payload };

    const entry = def.states[target].entry;
    if (entry) await Promise.resolve(entry(snapshot.ctx, evt));

    const next: FlowInstanceSnapshot<unknown> = {
      ...snapshot,
      state: target,
      updatedAt: Date.now(),
    };
    await store.save(next);

    for (const h of transitionHandlers) h({ instanceId: snapshot.instanceId, from, to: target, event: evt });

    const nextStateDef = def.states[target] as FlowStateDef<unknown>;
    if (nextStateDef.timeoutMs && nextStateDef.onTimeout) {
      const tid = setTimeout(() => {
        timers.delete(snapshot.instanceId);
        dispatch(snapshot.instanceId, { type: nextStateDef.onTimeout! }).catch(() => {});
      }, nextStateDef.timeoutMs);
      timers.set(snapshot.instanceId, tid);
    }

    return next;
  }

  async function dispatch(instanceId: string, evt: FlowEvent): Promise<FlowInstanceSnapshot<unknown>> {
    const snapshot = await store.load(instanceId);
    if (!snapshot) throw new Error(`No instance ${instanceId}`);
    return runTransition(snapshot, evt.type, evt.payload);
  }

  return {
    register(def) {
      defs.set(def.id, def as FlowDef<unknown>);
    },
    async start(flowId, opts) {
      const def = defs.get(flowId);
      if (!def) throw new Error(`Flow ${flowId} not registered`);
      const snapshot: FlowInstanceSnapshot<unknown> = {
        instanceId: opts.instanceId,
        flowId,
        state: def.initial,
        ctx: opts.ctx as unknown,
        updatedAt: Date.now(),
      };
      await store.save(snapshot);
      const stateDef = def.states[def.initial] as FlowStateDef<unknown>;
      if (stateDef?.timeoutMs && stateDef.onTimeout) {
        const tid = setTimeout(() => {
          timers.delete(opts.instanceId);
          dispatch(opts.instanceId, { type: stateDef.onTimeout! }).catch(() => {});
        }, stateDef.timeoutMs);
        timers.set(opts.instanceId, tid);
      }
      return snapshot as FlowInstanceSnapshot<typeof opts.ctx>;
    },
    dispatch,
    async getSnapshot(instanceId) {
      return store.load(instanceId);
    },
    onTransition(handler) {
      transitionHandlers.push(handler);
      return () => {
        const i = transitionHandlers.indexOf(handler);
        if (i >= 0) transitionHandlers.splice(i, 1);
      };
    },
  };
}
