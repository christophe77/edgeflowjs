# @edgeflowjs/observability

Logger and redaction utilities.

## Install

```bash
pnpm add @edgeflowjs/observability
```

## Exports

- `createLogger` — Create a structured logger
- `redactKeys` — Redact sensitive keys from objects
- Types: `Logger`, `LogLevel`

## Usage

```ts
import { createLogger } from "@edgeflowjs/observability";

const logger = createLogger({ level: "info" });
logger.info("Flow started", { instanceId: "main" });
logger.error("Sync failed", { err: e.message });
```
