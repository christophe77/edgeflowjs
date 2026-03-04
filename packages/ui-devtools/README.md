# @edgeflowjs/ui-devtools

React components for the EdgeFlow debug dashboard: FlowTimeline, OutboxInspector, CrashReports.

## Install

```bash
pnpm add @edgeflowjs/ui-devtools
```

## Exports

- `FlowTimeline` — Transition history and current state
- `OutboxInspector` — Outbox events (pending/failed), retry button
- `CrashReports` — Crash report list
- Types: `FlowTimelineProps`, `OutboxInspectorProps`, `CrashReportsProps`, `TransitionEntry`, `OutboxEvent`, `CrashEntry`

## Usage

```tsx
import { FlowTimeline, OutboxInspector, CrashReports } from "@edgeflowjs/ui-devtools";

<FlowTimeline transitions={transitions} snapshot={snapshot} instanceId="purchase-1" />
<OutboxInspector events={outbox} stats={stats} onRetry={handleRetry} />
<CrashReports crashes={crashes} />
```

Data comes from the bridge: `flow.getSnapshot`, `flow.transition` events, `sync.outbox.list`, `crash.list`.

## Docs

- [DevTools app](../../apps/devtools/README.md)
