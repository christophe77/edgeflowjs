import type { FlowDef } from "./types.js";

/**
 * Define a flow with full type inference for context TCtx.
 * Use with createFlowEngine().register().
 *
 * @example
 * const purchaseFlow = defineFlow<PurchaseContext>({
 *   id: "purchase",
 *   initial: "idle",
 *   states: {
 *     idle: { on: { SCAN: "scan" } },
 *     scan: { on: { SCANNED: "action" }, timeoutMs: 30000, onTimeout: "TIMEOUT" },
 *     action: { on: { DONE: "thankYou" } },
 *     thankYou: { on: { RESET: "idle" }, timeoutMs: 5000, onTimeout: "RESET" },
 *   },
 * });
 */
export function defineFlow<TCtx>(def: FlowDef<TCtx>): FlowDef<TCtx> {
  return def;
}
