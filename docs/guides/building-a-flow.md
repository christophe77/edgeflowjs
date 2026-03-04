# Building a Flow

This guide explains how to define and run flows with EdgeFlow's state machine engine.

## Define a Flow

Use `defineFlow()` to create a flow definition. It returns a `FlowDef` that you register with the engine.

```ts
import { defineFlow } from "@edgeflowjs/flow";

const purchaseFlow = defineFlow({
  id: "purchase",
  initial: "idle",
  states: {
    idle: {
      on: { START: "scan" },
    },
    scan: {
      timeoutMs: 30000,
      onTimeout: "TIMEOUT",
      on: {
        QR_DETECTED: "action",
        CANCEL: "idle",
        TIMEOUT: "idle",
      },
    },
    action: {
      on: { COMPLETE: "thankYou" },
    },
    thankYou: {
      timeoutMs: 5000,
      onTimeout: "TIMEOUT",
      on: { TIMEOUT: "idle" },
    },
  },
});
```

**Conventions:**
- Event types: `UPPER_SNAKE` (e.g. `START`, `QR_DETECTED`, `TIMEOUT`)
- `timeoutMs` — milliseconds before `onTimeout` event fires
- `on` — map of event type → target state

## Register and Start

```ts
import { createFlowEngine, createMemoryFlowStore } from "@edgeflowjs/flow";

const store = createMemoryFlowStore();
const flow = createFlowEngine(store);

flow.register(purchaseFlow);

const snapshot = await flow.start("purchase", {
  instanceId: "purchase-1",
  ctx: {},
});
```

`ctx` is the flow context — any data you want to carry between states (e.g. `scannedCode`, `userId`).

## Dispatch Events

```ts
await flow.dispatch("purchase-1", { type: "START" });
await flow.dispatch("purchase-1", { type: "QR_DETECTED", payload: { code: "QR123" } });
await flow.dispatch("purchase-1", { type: "COMPLETE" });
```

## Get Snapshot

```ts
const snap = await flow.getSnapshot("purchase-1");
// { instanceId, flowId, state, ctx, updatedAt }
```

## Subscribe to Transitions

```ts
const unsub = flow.onTransition((t) => {
  console.log(`${t.from} -> ${t.to} (${t.event.type})`);
});
// later: unsub()
```

## Typed Context

Use a generic for the context type:

```ts
const purchaseFlow = defineFlow<{ scannedCode?: string }>({
  id: "purchase",
  initial: "idle",
  states: {
    idle: { on: { START: "scan" } },
    scan: {
      on: { QR_DETECTED: "action" },
      // ...
    },
    // ...
  },
});
```

Then `ctx` in `FlowInstanceSnapshot` is typed as `{ scannedCode?: string }`.

## Example: Idle → Scan → Action → ThankYou

This matches the `example-kiosk` app:

1. **idle** — wait for `START`
2. **scan** — wait for `QR_DETECTED` or `CANCEL` or timeout (30s)
3. **action** — wait for `COMPLETE`
4. **thankYou** — auto-reset after 5s via `TIMEOUT` → `idle`

See [packages/core/src/run.ts](../../packages/core/src/run.ts) for the full flow used by the core.
