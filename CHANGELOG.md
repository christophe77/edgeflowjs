# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-03-10

### Added

- **create-edgeflow:** README in generated project (CLI commands, scripts, project structure, deploy tips)

---

## [0.2.1] - 2025-03-10

### Fixed

- **create-edgeflow:** Use `shell: true` for pnpm detection when run via npx (fixes "Install failed" with npm fallback)
- **create-edgeflow:** Show manual install command when install fails

---

## [0.2.0] - 2025-02-27

### Added

- **create-edgeflow:** Scaffold new kiosk projects with `npx @edgeflowjs/create-edgeflow my-kiosk`
- **CLI init:** `edgeflow init [name]` — alias for create-edgeflow
- **Standalone workflow:** Create projects without cloning the monorepo; update via `pnpm update @edgeflowjs/*`
- **Project detection:** CLI detects monorepo vs standalone; `getProjectRoot`, `getRuntimePath`, `getKioskDistPath`
- **Embedded deploy bundle:** Bundle logic in CLI; works for both monorepo and standalone
- **CLI restart:** `edgeflow restart` (local) and `edgeflow restart --host <ip>` (remote)
- **Doctor enhancements:** Pi detection, port 19707 check, `--host` for remote checks
- **Logs --host:** `edgeflow logs --host <ip>` for remote journalctl

### Changed

- **Deploy:** Uses embedded createBundle instead of external script; supports standalone projects
- **Build/Dev:** Use `getProjectRoot()`; support pnpm or npm

---

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
