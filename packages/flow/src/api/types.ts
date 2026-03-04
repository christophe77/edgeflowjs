/**
 * Event dispatched to a flow instance. Use UPPER_SNAKE for event types (e.g. SCAN, TIMEOUT, RESET).
 */
export type FlowEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  payload?: TPayload;
};

/** Guard function: return false to block a transition. */
export type TransitionGuard<TCtx> = (ctx: TCtx, evt: FlowEvent) => boolean | Promise<boolean>;

/** Action executed on transition (entry/exit or per-transition). */
export type TransitionAction<TCtx> = (ctx: TCtx, evt: FlowEvent) => void | Promise<void>;

/**
 * Definition of a single state. `on` maps event types to target states or { target, guard?, action? }.
 * Use `timeoutMs` + `onTimeout` for automatic transitions (e.g. return to idle).
 */
export type FlowStateDef<TCtx> = {
  on?: Record<
    string,
    | string
    | {
        target: string;
        guard?: TransitionGuard<TCtx>;
        action?: TransitionAction<TCtx>;
      }
  >;
  timeoutMs?: number;
  onTimeout?: string;
  entry?: TransitionAction<TCtx>;
  exit?: TransitionAction<TCtx>;
};

/**
 * Complete flow definition. Use with defineFlow() for type inference.
 */
export type FlowDef<TCtx> = {
  id: string;
  initial: string;
  states: Record<string, FlowStateDef<TCtx>>;
  version?: string;
};

/** Persisted snapshot of a flow instance (state + context). */
export type FlowInstanceSnapshot<TCtx> = {
  instanceId: string;
  flowId: string;
  state: string;
  ctx: TCtx;
  updatedAt: number;
};
