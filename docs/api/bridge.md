# Bridge API

WebSocket protocol connecting the React UI to the Node.js core. See [guides/bridge-protocol.md](../guides/bridge-protocol.md) for usage.

## Server (Node.js)

```ts
import { createBridgeServer } from "@edgeflowjs/bridge";

const bridge = createBridgeServer({
  port: 19707,
  logger: myLogger,
});

await bridge.start();
bridge.publish({ id: "...", type: "flow.transition", ts: Date.now(), payload: { ... } });
await bridge.stop();
```

## Client (Browser)

```ts
import { createBridgeClient } from "@edgeflowjs/bridge/client";

const bridge = createBridgeClient({ url: "ws://localhost:19707" });

const data = await bridge.request({
  id: crypto.randomUUID(),
  type: "flow.getSnapshot",
  ts: Date.now(),
  payload: { instanceId: "purchase-1" },
});

const unsub = bridge.subscribe((evt) => {
  if (evt.type === "flow.transition") console.log(evt.payload);
});
```

## Types

### BridgeRequest

Request types sent by the client:

| Type | Payload |
|------|---------|
| `ping` | `{}` |
| `flow.getSnapshot` | `{ instanceId }` |
| `flow.dispatch` | `{ instanceId, event: { type, payload? } }` |
| `maintenance.unlock` | `{ method, token }` |
| `maintenance.action` | `{ sessionId, action, input? }` |
| `sync.outbox.list` | `{ limit?, status? }` |
| `sync.outbox.retry` | `{ ids }` |
| `crash.list` | `{ limit? }` |
| `ota.check` | `{}` |
| `ota.apply` | `{ version }` |

### BridgeEvent

Event types published by the server:

| Type | Payload |
|------|---------|
| `flow.transition` | `{ instanceId, from, to, eventType }` |
| `sync.outbox.updated` | `{ pending, failed }` |
| `device.network.changed` | `{ online, kind? }` |
| `device.serial.received` | `{ port, data }` |
| `ota.status` | `{ state, version? }` |
| `log` | `{ level, msg, meta? }` |

### BridgeServer

```ts
type BridgeServer = {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(evt: BridgeEvent): void;
};
```

### BridgeClient

```ts
type BridgeClient = {
  request<T = unknown>(req: BridgeRequest): Promise<T>;
  subscribe(handler: (evt: BridgeEvent) => void): () => void;
};
```

## Full Interface Definitions

See [REPO.md](../REPO.md) section 2.2 for complete types including `Envelope`, `BridgeResponse`, and payload shapes.
