# @edgeflow/observability

Logger and redaction utilities.

## Install

```bash
pnpm add @edgeflow/observability
```

## Exports

- `createLogger` — Create a structured logger
- `redactKeys` — Redact sensitive keys from objects
- Types: `Logger`, `LogLevel`

## Usage

```ts
import { createLogger } from "@edgeflow/observability";

const logger = createLogger({ level: "info" });
logger.info("Flow started", { instanceId: "main" });
logger.error("Sync failed", { err: e.message });
```
