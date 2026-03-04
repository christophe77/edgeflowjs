export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export type Logger = {
  child(meta: Record<string, unknown>): Logger;
  log(level: LogLevel, msg: string, meta?: unknown): void;
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
};

function redact(obj: unknown, keys: string[]): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => redact(v, keys));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = keys.some((r) => k.toLowerCase().includes(r.toLowerCase())) ? "[REDACTED]" : redact(v, keys);
  }
  return out;
}

export function createLogger(opts: {
  level: LogLevel;
  redactionKeys?: string[];
  filePath?: string;
}): Logger {
  const minLevel = LEVEL_ORDER[opts.level];
  const redactionKeys = opts.redactionKeys ?? ["password", "token", "secret"];
  const baseMeta: Record<string, unknown> = {};

  function doLog(meta: Record<string, unknown>, level: LogLevel, msg: string, extra?: unknown): void {
    if (LEVEL_ORDER[level] < minLevel) return;
    const payload = {
      level,
      msg,
      ...baseMeta,
      ...meta,
      ...(extra && typeof extra === "object" ? (redact(extra, redactionKeys) as object) : {}),
    };
    const line = JSON.stringify({ ts: Date.now(), ...payload });
    if (level === "error") console.error(line);
    else console.log(line);
  }

  function createChild(meta: Record<string, unknown>): Logger {
    const childMeta = { ...baseMeta, ...meta };
    return {
      child(m) {
        return createChild({ ...childMeta, ...m });
      },
      log(level, msg, extra) {
        doLog(childMeta, level, msg, extra);
      },
      debug(msg, extra) {
        doLog(childMeta, "debug", msg, extra);
      },
      info(msg, extra) {
        doLog(childMeta, "info", msg, extra);
      },
      warn(msg, extra) {
        doLog(childMeta, "warn", msg, extra);
      },
      error(msg, extra) {
        doLog(childMeta, "error", msg, extra);
      },
    };
  }

  return {
    child(meta) {
      return createChild(meta);
    },
    log(level, msg, extra) {
      doLog(baseMeta, level, msg, extra);
    },
    debug(msg, extra) {
      doLog(baseMeta, "debug", msg, extra);
    },
    info(msg, extra) {
      doLog(baseMeta, "info", msg, extra);
    },
    warn(msg, extra) {
      doLog(baseMeta, "warn", msg, extra);
    },
    error(msg, extra) {
      doLog(baseMeta, "error", msg, extra);
    },
  };
}
