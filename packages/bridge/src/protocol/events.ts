import type { Envelope } from "./envelope.js";

export type BridgeEvent =
  | Envelope<"device.network.changed", { online: boolean; kind?: string }>
  | Envelope<"device.serial.received", { port: string; data: string }>
  | Envelope<"flow.transition", { instanceId: string; from: string; to: string; eventType: string }>
  | Envelope<"sync.outbox.updated", { pending: number; failed: number }>
  | Envelope<
      "ota.status",
      { state: "idle" | "checking" | "downloading" | "verifying" | "applying" | "rollback" | "done"; version?: string }
    >
  | Envelope<"log", { level: "debug" | "info" | "warn" | "error"; msg: string; meta?: unknown }>;
