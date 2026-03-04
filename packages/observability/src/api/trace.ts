import { randomUUID } from "node:crypto";

/**
 * Create a trace ID (UUID) for request correlation.
 * Propagate via traceId in bridge envelope and sync outbox; log with traceId for correlation.
 */
export function createTraceId(): string {
  return randomUUID();
}
