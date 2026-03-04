# Flow API

State machine engine for deterministic kiosk flows. See [guides/building-a-flow.md](../guides/building-a-flow.md) for a tutorial.

## Install

```bash
pnpm add @edgeflowjs/flow
```

In a monorepo workspace, add to `package.json`:

```json
"dependencies": { "@edgeflowjs/flow": "workspace:*" }
```

## Exports

```ts
import {
  defineFlow,
  createFlowEngine,
  createMemoryFlowStore,
  type FlowDef,
  type FlowEvent,
  type FlowEngine,
  type FlowStore,
  type FlowInstanceSnapshot,
  type FlowStateDef,
  type TransitionGuard,
  type TransitionAction,
} from "@edgeflowjs/flow";
```

## Main Types

### FlowDef

Flow definition. Created with `defineFlow()`.

```ts
type FlowDef<TCtx> = {
  id: string;
  initial: string;
  states: Record<string, FlowStateDef<TCtx>>;
  version?: string;
};
```

### FlowEvent

Event dispatched to a flow.

```ts
type FlowEvent<TType = string, TPayload = unknown> = {
  type: TType;
  payload?: TPayload;
};
```

### FlowInstanceSnapshot

Current state of a flow instance.

```ts
type FlowInstanceSnapshot<TCtx> = {
  instanceId: string;
  flowId: string;
  state: string;
  ctx: TCtx;
  updatedAt: number;
};
```

### FlowEngine

```ts
type FlowEngine = {
  register<TCtx>(def: FlowDef<TCtx>): void;
  start<TCtx>(flowId: string, opts: { instanceId: string; ctx: TCtx }): Promise<FlowInstanceSnapshot<TCtx>>;
  dispatch(instanceId: string, evt: FlowEvent): Promise<FlowInstanceSnapshot<any>>;
  getSnapshot(instanceId: string): Promise<FlowInstanceSnapshot<any> | null>;
  onTransition(handler: (t: { instanceId: string; from: string; to: string; event: FlowEvent }) => void): () => void;
};
```

## Usage

```ts
const store = createMemoryFlowStore();
const flow = createFlowEngine(store);

const purchaseFlow = defineFlow({
  id: "purchase",
  initial: "idle",
  states: {
    idle: { on: { START: "scan" } },
    scan: { timeoutMs: 30000, onTimeout: "TIMEOUT", on: { QR_DETECTED: "action", TIMEOUT: "idle" } },
    action: { on: { COMPLETE: "thankYou" } },
    thankYou: { timeoutMs: 5000, onTimeout: "TIMEOUT", on: { TIMEOUT: "idle" } },
  },
});

flow.register(purchaseFlow);
await flow.start("purchase", { instanceId: "main", ctx: {} });
await flow.dispatch("main", { type: "START" });
const snap = await flow.getSnapshot("main");
```

## Full Interface Definitions

See [REPO.md](../REPO.md) section 2.3 for complete type definitions including `FlowStateDef`, `TransitionGuard`, `TransitionAction`, and `FlowStore`.
