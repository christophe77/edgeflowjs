# EdgeFlow

**A JavaScript-First Framework for Industrial Kiosks & Raspberry Pi Devices**

---

## 1. Vision

EdgeFlow is a developer-first framework designed to build, deploy, and maintain industrial kiosks and Raspberry Pi–based devices using modern JavaScript/TypeScript.

It bridges the gap between:

- React-based tactile UI
- Node.js runtime
- Hardware access (GPIO, Serial, USB, I2C)
- Offline-first event systems
- Secure maintenance workflows
- OTA deployment & recovery

The goal is to provide enterprise-grade edge infrastructure with a developer experience comparable to modern web frameworks.

---

## 2. Problem Statement

Building a kiosk or Raspberry Pi device today typically involves:

- Chromium in kiosk mode
- Manual systemd services
- Ad-hoc Node services for hardware
- Bash scripts for updates
- No standardized flow engine
- Poor offline sync strategies
- No built-in observability
- Fragile OTA updates
- Difficult field maintenance

There is no coherent JS-native framework that treats kiosk/edge devices as first-class citizens.

---

## 3. Core Principles

- **JavaScript-first**
  - Full TypeScript support
  - Unified runtime (Node + React)

- **Offline-first**
  - Local persistence
  - Outbox pattern
  - Sync reconciliation

- **Flow-driven architecture**
  - Explicit state machines for UX
  - Deterministic kiosk lifecycle

- **Hardware abstraction**
  - Unified device APIs
  - Swappable adapters

---

## 4. System Architecture Overview

EdgeFlow is composed of 6 major layers:

```
+--------------------------------------------------+
|                   React UI Layer                 |
+--------------------------------------------------+
|               Flow Engine (State)                |
+--------------------------------------------------+
|            Application / Use-Case Layer          |
+--------------------------------------------------+
|        Device Abstraction + System APIs         |
+--------------------------------------------------+
|          Sync Engine + Persistence Layer         |
+--------------------------------------------------+
|                OS Integration Layer              |
+--------------------------------------------------+
```

Each layer has strict dependency rules:

- UI depends on Flow + Application
- Flow depends on Application
- Application depends on Ports
- Infrastructure implements Ports
- Hardware layer never depends on UI

This enforces SOLID + Clean Architecture principles.

---

## 5. Runtime Model

EdgeFlow runs as a unified process:

- Node.js runtime (core engine)
- React UI (Chromium in kiosk mode)
- Local HTTP or IPC bridge between UI and core
- Single deployment artifact

Two possible runtime modes:

1. **Single Process Mode** (default) — Node runs backend logic and serves the UI locally.
2. **Split Mode** — Node core + UI served separately (useful for heavy setups).

---

## 6. Flow Engine (Core Differentiator)

EdgeFlow includes a built-in deterministic state machine system.

**Example:**

```js
import { defineFlow, createFlowEngine, createMemoryFlowStore } from "@edgeflowjs/flow";

const flow = createFlowEngine(createMemoryFlowStore());
flow.register(defineFlow({
  id: "purchase",
  initial: "idle",
  states: {
    idle: { on: { START: "scan" } },
    scan: {
      timeoutMs: 30000,
      onTimeout: "TIMEOUT",
      on: { QR_DETECTED: "payment", CANCEL: "idle", TIMEOUT: "idle" }
    },
    payment: {
      on: { SUCCESS: "dispense", FAILURE: "error" }
    },
    dispense: {
      on: { COMPLETE: "thankYou" }
    },
    thankYou: {
      timeoutMs: 5000,
      onTimeout: "TIMEOUT",
      on: { TIMEOUT: "idle" }
    }
  }
}));

await flow.start("purchase", { instanceId: "main", ctx: {} });
await flow.dispatch("main", { type: "START" });
```

**Features:**

- Automatic timeout handling
- Auto-reset logic
- Interrupt priority handling
- Crash-safe flow persistence
- Flow replay for debugging
- Flow simulation mode

This solves a major kiosk UX issue: unpredictable states.

---

## 7. Device Abstraction Layer

EdgeFlow exposes typed, cross-platform hardware APIs.

**Example:**

```js
device.gpio.read(17)
device.gpio.write(17, true)

device.serial.open("/dev/ttyUSB0")
device.serial.send(buffer)

device.usb.list()
device.network.status()
device.system.reboot()
device.system.shutdown()
device.display.setBrightness(80)
```

**Supported transports:**

- GPIO
- Serial (RS232 / USB)
- I2C
- SPI
- WebUSB (optional)
- MQTT bridge
- HTTP adapters

All hardware interactions are async, resilient, and logged. Simulation mode replaces real hardware automatically during development.

---

## 8. Sync Engine (Offline-First Core)

EdgeFlow includes a built-in synchronization layer.

**Features:**

- Local SQLite storage
- Event sourcing pattern
- Outbox queue
- Automatic retry with backoff
- Idempotency keys
- Conflict detection hooks
- Partial sync recovery

**Example:**

```js
sync.defineEntity("DispenseAttempt", {
  strategy: "outbox",
  retry: true
})
```

When network is unavailable:

- Events are stored locally
- Queue is retried automatically
- UI state reflects sync status

This prevents data loss and ensures consistency.

---

## 9. Maintenance Mode

EdgeFlow provides a secure maintenance access layer.

**Activation methods:**

- Special QR code
- USB key
- Physical button sequence
- Remote unlock token

**Maintenance panel includes:**

- Hardware tests
- GPIO monitor
- Network diagnostics
- Sync queue viewer
- Log viewer
- Manual actions (e.g. trigger relay, simulate dispense)
- System reboot
- Update status

**Security:**

- Token-based session
- Expiring maintenance sessions
- Audit log for maintenance actions

---

## 10. OTA Update System

EdgeFlow supports industrial-grade update workflows.

**Features:**

- Signed update packages
- Delta updates
- Rollback on failure
- Watchdog-based health checks
- Canary deployments
- Version pinning by device ID

**Update flow:**

1. Device checks update endpoint
2. Downloads package
3. Verifies signature
4. Switches to new version
5. Health check
6. Rollback if failure

All update steps are logged.

---

## 11. Observability Layer

Built-in telemetry system.

**Local logs:**

- Structured JSON logs
- Log levels
- Persistent local file
- Crash dump storage

**Optional remote push:**

- Batch sync
- Event timeline
- Crash reports

**Developer tools:**

- Flow visualizer
- State timeline
- Event replay
- Hardware interaction trace
- Sync queue inspector

---

## 12. CLI Experience

EdgeFlow includes a dedicated CLI.

```bash
npx create-edgeflow my-kiosk    # Create new project (standalone)
edgeflow init [name]            # Alias for create-edgeflow
edgeflow dev
edgeflow build
edgeflow simulate
edgeflow deploy --host <ip>
edgeflow logs [--host <ip>]
edgeflow restart [--host <ip>]
edgeflow update
edgeflow doctor [--host <ip>]
```

**CLI features:**

- Auto-detect Raspberry Pi
- Flash image
- Install systemd services
- Setup kiosk Chromium mode
- Configure network
- Setup auto-restart
- Validate permissions

---

## 13. Development Experience

**Dev Mode:**

- Hot reload UI
- Hardware simulation
- Network simulation
- Flow simulation
- Debug dashboard at `localhost:3001/devtools`

**Hardware mocking example:**

```js
simulate.gpio.set(17, true)
simulate.serial.inject("QR:123456")
```

---

## 14. Supported Platforms (MVP)

- Raspberry Pi OS
- Debian Linux
- Ubuntu
- Windows IoT
- Linux x86 kiosk

**Future:**

- Jetson devices
- ARM industrial boards

---

## 15. Recommended Internal Architecture

**Monorepo structure:**

```
/packages
  /core
  /flow
  /device
  /sync
  /cli
  /ui
/apps
  /example-kiosk
```

**Layering rules:**

- UI imports only flow + application
- Device layer implements ports
- Sync layer isolated
- No direct hardware calls from UI

---

## 16. MVP Scope (4–6 Weeks)

**Phase 1:**

- Basic flow engine
- GPIO abstraction
- Simple sync queue
- CLI scaffolding
- Dev simulator

**Phase 2:**

- Maintenance panel
- OTA basic implementation
- Logging system
- Device health check

**Phase 3:** ✓ Complete

- Flow visualizer
- Crash recovery
- Production build mode

**Phase 4:** ✓ Complete

- i18n layer
- Multi-locale support

**Phase 5:** ✓ Complete

- create-edgeflow (npx create-edgeflow)
- edgeflow init
- Standalone workflow (no monorepo clone)
- Remote deploy (--host) for monorepo and standalone

---

## 17. Business Positioning

**Target customers:**

- Retail kiosks
- Beverage machines
- Smart lockers
- Museum interactive displays
- Industrial control panels
- EV charging terminals
- Vending startups

**Monetization model:**

- Open source core + Paid Pro modules (OTA, Observability, Maintenance)

---

## 18. Long-Term Vision

EdgeFlow becomes:

- **The "Next.js of physical machines"** — a standard way to build intelligent edge systems using JavaScript with industrial reliability.

**If you want, next step we can:**

- Define exact internal interfaces for each module
- Design the Flow engine API properly
- Define the Sync engine data model
- Draft the CLI command architecture
- Or turn this into a technical RFC v1.0 ready to publish on GitHub
