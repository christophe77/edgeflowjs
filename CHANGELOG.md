# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-27

### Added

- **Core:** Bootstrap, runnable server (`packages/core/src/run.ts`), composition of bridge, flow, device, sync, maintenance, OTA
- **Bridge:** WebSocket server (Node) and client (browser), UI ↔ core protocol
- **Flow:** State machine engine with `defineFlow`, `register`, `start`, `dispatch`, `getSnapshot`, `onTransition`
- **Device:** Port interfaces (GPIO, Serial, Network, System, Identity)
- **Device-sim:** Simulator for development (injectSerial, setGpio, setNetworkOnline)
- **Sync:** SQLite outbox, retry with backoff, `sync.outbox.updated` events
- **Observability:** Logger (createLogger)
- **Maintenance:** Unlock (token, TTL 10 min), runAction (device.testGpio, device.injectSerial, sync.retry, system.reboot, ota.check)
- **OTA:** Stub (check, apply, status events)
- **CLI:** dev, build, simulate, deploy, logs, update, doctor
- **ui-devtools:** Flow visualizer, timeline, OutboxInspector, CrashReports
- **apps/example-kiosk:** Vite + React reference app (Idle → Scan → Action → ThankYou + Maintenance)
- **apps/devtools:** Debug dashboard at localhost:3001
- **Crash recovery:** uncaughtException/unhandledRejection handlers, crash_reports persistence
- **Production build:** Vite optimizations (manualChunks, sourcemap: false)
- **Phase 3:** Complete (flow visualizer, crash recovery, production build)
- **Phase 4:** i18n layer (`@edgeflowjs/i18n`), multi-locale support
