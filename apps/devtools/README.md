# devtools

Debug dashboard for EdgeFlow: flow timeline, outbox inspector, crash reports.

## Run

From repo root:

```bash
pnpm dev:devtools   # DevTools only (requires core running)
pnpm dev:all        # Core + example-kiosk + devtools
```

The dashboard opens at `http://localhost:3001`.

## Features

- **FlowTimeline** — Transition history and current flow state
- **OutboxInspector** — Pending/failed outbox events, retry button
- **CrashReports** — Recent crash reports from the core

## Requirements

The core must be running (bridge server). The devtools app connects via `VITE_BRIDGE_URL` (default: `ws://localhost:19707`).

## Components

Uses `@edgeflow/ui-devtools` for FlowTimeline, OutboxInspector, CrashReports. Data is fetched via bridge requests (`flow.getSnapshot`, `sync.outbox.list`, `crash.list`) and real-time events (`flow.transition`, `sync.outbox.updated`).
