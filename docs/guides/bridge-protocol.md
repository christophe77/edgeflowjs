# Bridge Protocol

The bridge connects the React UI to the Node.js core over WebSocket. This guide covers the protocol and client usage.

## Transport

- **Server:** WebSocket on `ws://localhost:19707` (configurable via `BRIDGE_PORT`)
- **Client:** Native `WebSocket` in the browser

The UI app uses `VITE_BRIDGE_URL` (e.g. `ws://localhost:19707`) to connect.

## Message Format

All messages are JSON. Each has:
- `id` — UUID
- `type` — message type
- `ts` — timestamp (epoch ms)
- `payload` — type-specific data

## Requests (Client → Server)

The client sends requests; the server responds with `ok` or `error`.

| Type | Payload | Description |
|------|---------|-------------|
| `ping` | `{}` | Health check |
| `flow.getSnapshot` | `{ instanceId }` | Get current flow state |
| `flow.dispatch` | `{ instanceId, event: { type, payload? } }` | Dispatch event to flow |
| `maintenance.unlock` | `{ method, token }` | Unlock maintenance |
| `maintenance.action` | `{ sessionId, action, input? }` | Run maintenance action |
| `sync.outbox.list` | `{ limit?, status? }` | List outbox events |
| `sync.outbox.retry` | `{ ids }` | Retry failed events |
| `ota.check` | `{}` | Check for updates |
| `crash.list` | `{ limit? }` | List crash reports |

## Responses (Server → Client)

- **ok:** `{ type: "ok", payload: { requestId, data? } }`
- **error:** `{ type: "error", payload: { requestId, code, message } }`
- **pong:** `{ type: "pong", payload: { requestId } }` (for ping)

## Events (Server → Client)

The server publishes events that clients can subscribe to:

| Type | Payload | Description |
|------|---------|-------------|
| `flow.transition` | `{ instanceId, from, to, eventType }` | Flow state changed |
| `sync.outbox.updated` | `{ pending, failed }` | Outbox stats changed |
| `device.network.changed` | `{ online, kind? }` | Network status changed |
| `device.serial.received` | `{ port, data }` | Serial data received |
| `ota.status` | `{ state, version? }` | OTA status update |

## Client Usage (React)

```ts
import { createBridgeClient } from "@edgeflowjs/bridge/client";

const url = import.meta.env.VITE_BRIDGE_URL ?? "ws://localhost:19707";
const bridge = createBridgeClient({ url });

// Request
const snapshot = await bridge.request({
  id: crypto.randomUUID(),
  type: "flow.getSnapshot",
  ts: Date.now(),
  payload: { instanceId: "purchase-1" },
});

// Dispatch
await bridge.request({
  id: crypto.randomUUID(),
  type: "flow.dispatch",
  ts: Date.now(),
  payload: {
    instanceId: "purchase-1",
    event: { type: "START" },
  },
});

// Subscribe to events
const unsub = bridge.subscribe((evt) => {
  if (evt.type === "flow.transition") {
    console.log(evt.payload);
  }
});
// later: unsub()
```

The client handles reconnection and matches responses to requests by `requestId`.
