/**
 * Client-only exports for browser usage. Use this instead of the main package
 * to avoid pulling in Node.js server code (http, ws).
 */
export type { BridgeEvent, BridgeRequest, BridgeResponse } from "./protocol/index.js";
export type { BridgeClient } from "./client/createBridgeClient.js";
export { createBridgeClient } from "./client/createBridgeClient.js";
