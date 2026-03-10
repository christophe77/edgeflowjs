# EdgeFlow — Documentation

Documentation index for the EdgeFlow framework.

## Getting Started

| Document | Description |
|----------|-------------|
| [Getting Started](guides/getting-started.md) | Prerequisites, create-edgeflow (standalone) or clone (monorepo), first run, troubleshooting |

## Guides

| Document | Description |
|----------|-------------|
| [Building a Flow](guides/building-a-flow.md) | Define flows with `defineFlow()`, register, dispatch, timeouts |
| [Bridge Protocol](guides/bridge-protocol.md) | UI ↔ core communication, WebSocket, requests, events |
| [Deployment](guides/deployment.md) | Production build, .env.production, Raspberry Pi, remote deploy, standalone |
| [i18n](guides/i18n.md) | Multi-language kiosks, locale management, React integration |

## API Reference

| Document | Description |
|----------|-------------|
| [Flow API](api/flow.md) | FlowDef, FlowEngine, defineFlow, FlowEvent, FlowInstanceSnapshot |
| [Bridge API](api/bridge.md) | BridgeRequest, BridgeResponse, BridgeEvent, createBridgeServer, createBridgeClient |
| [Sync API](api/sync.md) | SyncStore, SyncEngine, OutboxEvent, createSqliteStore, createMemoryStore |
| [Device API](api/device.md) | DeviceApi, DeviceAdapter, GpioPort, SerialPort, NetworkPort, SystemPort |
| [i18n API](api/i18n.md) | I18n, createI18n, t(), formatDate, formatNumber, I18nProvider, useI18n, useT |

## Reference

| Document | Description |
|----------|-------------|
| [VISION](VISION.md) | Vision, principles, system architecture, MVP scope, positioning |
| [ARCHITECTURE](ARCHITECTURE.md) | Runtime topology, packages, Flow/Device/Sync deep dives, implementation order |
| [REPO](REPO.md) | Monorepo structure, public TypeScript interfaces per package |
| [RFC-v1](RFC-v1.md) | Technical RFC v1.0 (draft): scope, architecture, CLI |
| [SYNC-DATA-MODEL](SYNC-DATA-MODEL.md) | Sync schema: SQLite tables, outbox envelope, retry policy |
