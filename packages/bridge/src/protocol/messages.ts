import type { Envelope } from "./envelope.js";

export type BridgeRequest =
  | Envelope<"ping", object>
  | Envelope<"flow.getSnapshot", { instanceId: string }>
  | Envelope<"flow.dispatch", { instanceId: string; event: { type: string; payload?: unknown } }>
  | Envelope<"maintenance.unlock", { method: "qr" | "usb" | "button" | "remote"; token: string }>
  | Envelope<"maintenance.action", { sessionId: string; action: string; input?: unknown }>
  | Envelope<"sync.outbox.list", { limit?: number; status?: "pending" | "failed" | "sent" }>
  | Envelope<"sync.outbox.retry", { ids: string[] }>
  | Envelope<"crash.list", { limit?: number }>
  | Envelope<"ota.check", object>
  | Envelope<"ota.apply", { version: string }>;

export type BridgeResponse =
  | Envelope<"pong", { requestId?: string }>
  | Envelope<"ok", { requestId: string; data?: unknown }>
  | Envelope<"error", { requestId: string; code: string; message: string; details?: unknown }>;
