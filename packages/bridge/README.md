# @edgeflow/bridge

WebSocket protocol connecting the React UI to the Node.js core.

## Install

```bash
pnpm add @edgeflow/bridge
```

## Server (Node.js)

```ts
import { createBridgeServer } from "@edgeflow/bridge";

const bridge = createBridgeServer({ port: 19707, logger });
await bridge.start();
bridge.publish({ id: "...", type: "flow.transition", ts: Date.now(), payload: { ... } });
```

## Client (Browser)

Use the `/client` subpath to avoid pulling in Node dependencies:

```ts
import { createBridgeClient } from "@edgeflow/bridge/client";

const bridge = createBridgeClient({ url: "ws://localhost:19707" });
const data = await bridge.request({ id: crypto.randomUUID(), type: "flow.getSnapshot", ts: Date.now(), payload: { instanceId: "main" } });
bridge.subscribe((evt) => console.log(evt));
```

## Docs

- [API reference](../../docs/api/bridge.md)
- [Bridge protocol guide](../../docs/guides/bridge-protocol.md)
