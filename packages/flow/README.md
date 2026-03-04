# @edgeflowjs/flow

State machine engine for deterministic kiosk flows.

## Install

```bash
pnpm add @edgeflowjs/flow
```

In a workspace: `"@edgeflowjs/flow": "workspace:*"`

## Exports

- `defineFlow` — Create a flow definition
- `createFlowEngine` — Create the runtime
- `createMemoryFlowStore` — In-memory persistence (MVP)
- Types: `FlowDef`, `FlowEvent`, `FlowEngine`, `FlowStore`, `FlowInstanceSnapshot`, `FlowStateDef`, `TransitionGuard`, `TransitionAction`

## Usage

```ts
import { defineFlow, createFlowEngine, createMemoryFlowStore } from "@edgeflowjs/flow";

const flow = createFlowEngine(createMemoryFlowStore());
flow.register(defineFlow({
  id: "purchase",
  initial: "idle",
  states: { idle: { on: { START: "scan" } }, scan: { on: { DONE: "idle" } } },
}));

await flow.start("purchase", { instanceId: "main", ctx: {} });
await flow.dispatch("main", { type: "START" });
```

## Docs

- [API reference](../../docs/api/flow.md)
- [Building a flow guide](../../docs/guides/building-a-flow.md)
