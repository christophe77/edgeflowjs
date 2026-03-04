// Stub for MVP; traceId propagation can be added later.
export function createTraceId(): string {
  return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
