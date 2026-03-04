import { describe, it, expect } from "vitest";
import type { BridgeRequest, BridgeResponse, Envelope } from "./protocol/index.js";

describe("Bridge protocol", () => {
  it("serializes and deserializes ping request", () => {
    const req: BridgeRequest = {
      id: "req-1",
      type: "ping",
      ts: Date.now(),
      payload: {},
    };
    const json = JSON.stringify(req);
    const parsed = JSON.parse(json) as BridgeRequest;
    expect(parsed.type).toBe("ping");
    expect(parsed.id).toBe("req-1");
  });

  it("serializes and deserializes flow.getSnapshot request", () => {
    const req: BridgeRequest = {
      id: "req-2",
      type: "flow.getSnapshot",
      ts: Date.now(),
      payload: { instanceId: "purchase-1" },
    };
    const json = JSON.stringify(req);
    const parsed = JSON.parse(json) as BridgeRequest;
    expect(parsed.type).toBe("flow.getSnapshot");
    expect((parsed.payload as { instanceId: string }).instanceId).toBe("purchase-1");
  });

  it("serializes and deserializes ok response", () => {
    const res: BridgeResponse = {
      id: "res-1",
      type: "ok",
      ts: Date.now(),
      payload: { requestId: "req-1", data: { state: "idle" } },
    };
    const json = JSON.stringify(res);
    const parsed = JSON.parse(json) as BridgeResponse;
    expect(parsed.type).toBe("ok");
    expect((parsed.payload as { requestId: string }).requestId).toBe("req-1");
  });

  it("envelope has required fields", () => {
    const env: Envelope<"test", { x: number }> = {
      id: "e1",
      type: "test",
      ts: 123,
      payload: { x: 42 },
    };
    expect(env.id).toBeDefined();
    expect(env.type).toBe("test");
    expect(env.ts).toBe(123);
    expect(env.payload.x).toBe(42);
  });
});
