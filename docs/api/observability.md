# Observability API

Logger, metrics, and trace correlation for EdgeFlow.

## Install

```bash
pnpm add @edgeflowjs/observability
```

## Exports

```ts
import {
  createLogger,
  createMetrics,
  createTraceId,
  toPrometheusText,
  type Logger,
  type LogLevel,
  type Metrics,
} from "@edgeflowjs/observability";
```

## Logger

Structured JSON logging with level filtering and redaction:

```ts
const logger = createLogger({ level: "info" });
logger.info("Flow started", { instanceId: "purchase-1" });
logger.child({ traceId }).info("Request handled");
```

## Metrics

In-memory counters and gauges. The core exposes `flow_transitions_total`, `outbox_pending`, and `outbox_failed`:

```ts
const metrics = createMetrics();
metrics.counter("flow_transitions_total", 1);
metrics.gauge("outbox_pending", 5);
```

When the bridge server is created with `metrics`, a Prometheus `/metrics` endpoint is available at `http://localhost:BRIDGE_PORT/metrics`.

## Trace

`createTraceId()` returns a UUID for request correlation. Propagate via `traceId` in bridge envelope and sync outbox; include in log meta for correlation:

```ts
const traceId = createTraceId();
logger.child({ traceId }).info("Processing request");
```
