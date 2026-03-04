export function redactKeys(obj: unknown, keys: string[]): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactKeys(v, keys));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = keys.some((r) => k.toLowerCase().includes(r.toLowerCase())) ? "[REDACTED]" : redactKeys(v, keys);
  }
  return out;
}
