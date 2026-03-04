import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createFlowEngine, createMemoryFlowStore, defineFlow } from "./index.js";

describe("Flow engine", () => {
  let flow: ReturnType<typeof createFlowEngine>;
  let transitions: Array<{ from: string; to: string; eventType: string }>;
  let unsub: () => void;

  beforeEach(() => {
    const store = createMemoryFlowStore();
    flow = createFlowEngine(store);
    transitions = [];
    unsub = flow.onTransition((t) => transitions.push({ from: t.from, to: t.to, eventType: t.event.type }));

    flow.register(
      defineFlow({
        id: "test",
        initial: "a",
        states: {
          a: { on: { NEXT: "b" } },
          b: {
            on: { BACK: "a", NEXT: "c", TIMEOUT: "a" },
            timeoutMs: 100,
            onTimeout: "TIMEOUT",
          },
          c: { on: { RESET: "a" } },
        },
      })
    );
  });

  afterEach(() => {
    unsub();
  });

  it("starts in initial state", async () => {
    const snap = await flow.start("test", { instanceId: "i1", ctx: {} });
    expect(snap.state).toBe("a");
    expect(snap.flowId).toBe("test");
    expect(snap.instanceId).toBe("i1");
  });

  it("transitions on dispatch", async () => {
    await flow.start("test", { instanceId: "i1", ctx: {} });
    const snap = await flow.dispatch("i1", { type: "NEXT" });
    expect(snap.state).toBe("b");
    expect(transitions).toEqual([{ from: "a", to: "b", eventType: "NEXT" }]);
  });

  it("supports multiple transitions", async () => {
    await flow.start("test", { instanceId: "i1", ctx: {} });
    await flow.dispatch("i1", { type: "NEXT" });
    const snap = await flow.dispatch("i1", { type: "NEXT" });
    expect(snap.state).toBe("c");
    expect(transitions).toHaveLength(2);
  });

  it("triggers timeout", async () => {
    await flow.start("test", { instanceId: "i1", ctx: {} });
    await flow.dispatch("i1", { type: "NEXT" });
    await new Promise((r) => setTimeout(r, 250));
    const snap = await flow.getSnapshot("i1");
    expect(snap?.state).toBe("a");
    expect(transitions.some((t) => t.eventType === "TIMEOUT")).toBe(true);
  });

  it("returns snapshot via getSnapshot", async () => {
    await flow.start("test", { instanceId: "i1", ctx: {} });
    await flow.dispatch("i1", { type: "NEXT" });
    const snap = await flow.getSnapshot("i1");
    expect(snap?.state).toBe("b");
  });

  it("returns null for unknown instance", async () => {
    const snap = await flow.getSnapshot("unknown");
    expect(snap).toBeNull();
  });
});
