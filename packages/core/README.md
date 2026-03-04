# @edgeflow/core

Composition root: bootstrap, config, and runnable server. Composes bridge, flow, device, sync, maintenance, OTA.

## Install

```bash
pnpm add @edgeflow/core
```

## Exports

- `createEdgeflowApp` — Programmatic app bootstrap (plugins, adapters)
- `loadConfig` — Load config from env/file
- Types: `EdgeflowPlugin`, `EdgeflowContext`, `EdgeflowApp`, `EdgeflowConfig`

## Standalone Entry Point

Run the pre-composed server:

```bash
node packages/core/dist/run.js
```

Or via root scripts: `pnpm dev:core` or `pnpm dev`.

The run script starts: logger, device-sim, sync, flow, maintenance, OTA, bridge. It registers the "purchase" flow and listens for WebSocket connections.

## Docs

- [Architecture](../../docs/ARCHITECTURE.md)
- [REPO structure](../../docs/REPO.md)
