# EdgeFlow — Architecture Deep Dive Plan (Cursor-ready)

This plan is the roadmap to design EdgeFlow "for real": module boundaries, APIs, data flows, and the minimum set of decisions to unblock implementation.

---

## 0. Objectives for the Deep Dive

- Lock the module decomposition (packages + dependency rules)
- Define the public APIs (Flow, Device, Sync, Maintenance, OTA)
- Choose runtime topology (processes, IPC, local server)
- Define data model for offline-first + observability
- Specify security model (maintenance access, signing, permissions)
- Provide a reference app that exercises the whole stack end-to-end

**Deliverable:** a repo-ready RFC + skeleton implementation plan.

---

## 1. Runtime Topology & Boundaries

### 1.1 Processes

Decide between:

- **A) Single-process** (recommended MVP)
  - One Node process
  - Serves UI assets + exposes local API (HTTP or WebSocket)
  - Runs Flow, Device, Sync, Watchdog, OTA

- **B) Two-process**
  - Node "core daemon"
  - Chromium UI as separate process
  - IPC via unix socket / named pipe / WS

**MVP choice:** A, but design APIs as if B could exist.

### 1.2 IPC Contract (UI ↔ Core)

Define:

- **Transport:** HTTP+SSE, WebSocket, or gRPC over unix socket
- **Auth:** local token (file-based) + origin restrictions
- **Message schema:** typed events + request/response

**Outcome:** `@edgeflowjs/bridge` package.

---

## 2. Monorepo Packages & Dependency Rules

### 2.1 Packages (proposed)

- `@edgeflowjs/core` — composition root, lifecycle, DI, configuration
- `@edgeflowjs/bridge` — UI↔core API, event bus
- `@edgeflowjs/flow` — state machines + persistence + replay
- `@edgeflowjs/device` — ports + adapters + simulator
- `@edgeflowjs/sync` — local store, outbox, replication
- `@edgeflowjs/observability` — logs, metrics, traces, crash dumps
- `@edgeflowjs/maintenance` — admin auth, panel API, audit log
- `@edgeflowjs/ota` — update agent, package verification, rollback
- `@edgeflowjs/cli` — scaffold, dev, build, deploy, doctor
- `@edgeflowjs/ui-devtools` — flow visualizer, timeline, inspectors
- `@edgeflowjs/ui-kit` — optional: kiosk-centric components

### 2.2 Enforced Rules

Implement import boundaries with ESLint:

- UI can import only: bridge, flow client, ui-kit
- Application logic can import: flow, ports, domain types
- Adapters can import: device, sync, OS libs
- No reverse imports, no cross-domain bypass

**Outcome:** `eslint-plugin-edgeflow-boundaries`.

---

## 3. Core Composition & DI Strategy

### 3.1 Configuration System

Define:

- **Config sources:** env, file, device-provisioning, CLI flags
- **Schema validation:** zod
- **Runtime config hot reload:** optional

**Outcome:** `@edgeflowjs/core/config`.

### 3.2 Dependency Injection

Choose:

- Lightweight container (manual DI) for MVP
- Optional plugin mechanism later

**Outcome:**

```js
createEdgeflowApp({ plugins, adapters, config })
```

---

## 4. Flow Engine Deep Dive

### 4.1 Flow Model

Define:

- FlowId, InstanceId
- States, transitions, guards, actions, timeouts

**Persistence strategy:**

- Store current state + context
- Store event log for replay (optional toggle)

### 4.2 Flow Runtime

- Deterministic event handling
- Priority interrupts (e-stop, maintenance override)
- Cancellation token per flow
- Timeouts scheduled in a durable way (persisted timers)

### 4.3 Flow Debugging

- Snapshot exporter
- Timeline API
- Replay runner

**Outcomes:**

- `@edgeflowjs/flow` public API
- `@edgeflowjs/ui-devtools` minimal viewer

### 4.4 Flow Example (Idle → Scan → Action → ThankYou)

```ts
const purchaseFlow = defineFlow<{ scannedCode?: string }>({
  id: "purchase",
  initial: "idle",
  states: {
    idle: { on: { SCAN: "scan" } },
    scan: {
      on: { SCANNED: "action" },
      timeoutMs: 30000,
      onTimeout: "TIMEOUT",
    },
    action: { on: { DONE: "thankYou" } },
    thankYou: {
      on: { RESET: "idle" },
      timeoutMs: 5000,
      onTimeout: "RESET",
    },
  },
});

flow.register(purchaseFlow);
const snap = await flow.start("purchase", { instanceId: "main", ctx: {} });
await flow.dispatch("main", { type: "SCAN" });
await flow.dispatch("main", { type: "SCANNED", payload: { code: "QR123" } });
```

**Conventions:** event types in UPPER_SNAKE (`SCAN`, `TIMEOUT`, `RESET`); context `TCtx` holds flow-specific data.

---

## 5. Device Layer Deep Dive (Ports & Adapters)

### 5.1 Ports (interfaces)

Define minimal "industrial kiosk" set:

- GpioPort
- SerialPort
- UsbPort
- NetworkPort
- SystemPort (reboot/shutdown, service status)
- DisplayPort (brightness, orientation)
- StoragePort (disk usage, mount)
- TimePort (monotonic + wall clock)
- IdentityPort (device id, hw revision)

### 5.2 Adapters

- Raspberry (pigpio/onoff, serialport, etc.)
- Linux x86
- Windows IoT (later)
- Simulator adapter (mandatory MVP)

### 5.3 Device Eventing

Standardize event streams:

- `device.network.changed`
- `device.serial.received`
- `device.gpio.edge`

**Outcome:** `@edgeflowjs/device` + `@edgeflowjs/device-sim`.

---

## 6. Sync Engine Deep Dive (Offline-first)

### 6.1 Local Persistence

Choose:

- **SQLite for MVP** (better than IndexedDB since Node core owns it)

**Tables:**

- `outbox_events`
- `entities_cache`
- `sync_state`
- `audit_log`
- `crash_reports`

### 6.2 Outbox Pattern

Define:

- **Event envelope:** id, type, payload, occurredAt, idempotencyKey, retryCount, status
- **Retry policy:** exponential backoff + jitter
- **Dedupe rule:** idempotencyKey stable per "physical" event

### 6.3 Conflict Handling

Provide hooks:

- Last-write-wins default
- Custom resolver per entity type

**Outcome:** `@edgeflowjs/sync`.

---

## 7. Observability Deep Dive

### 7.1 Logging

- Structured JSON logs
- Rolling files
- Redaction rules (PII, secrets)

### 7.2 Metrics

- Device health metrics
- Queue sizes
- Flow durations
- Hardware errors

### 7.3 Tracing

- traceId propagated across flow + sync + device actions
- Optional OpenTelemetry export

**Outcome:** `@edgeflowjs/observability`.

---

## 8. Maintenance Mode Deep Dive

### 8.1 Auth Modes

- QR unlock code (time-based OTP or signed token)
- USB key with signed challenge
- Physical button sequence (GPIO)
- Remote unlock token (optional)

### 8.2 Capabilities

- Run hardware tests
- View logs + traces
- Trigger safe manual actions
- View / drain outbox
- Manage updates
- Diagnostics bundle export

### 8.3 Audit Logging

Every maintenance action writes:

- Who/when/how
- Parameters
- Outcome

**Outcome:** `@edgeflowjs/maintenance` + minimal UI panel.

---

## 9. OTA Update Deep Dive

### 9.1 Packaging Format

Define an update artifact:

- Manifest (version, sha256, required hw rev, migration steps)
- Signed payload
- Optional delta

### 9.2 Apply Strategy

- A/B partitions if available, otherwise "two folder + symlink" approach
- Healthcheck window
- Automatic rollback

**Outcome:** `@edgeflowjs/ota`.

---

## 10. OS Integration Deep Dive

### 10.1 Service Management

- systemd unit templates
- Watchdog integration
- Auto restart policies

### 10.2 Kiosk Mode

- Chromium flags
- Screen blanking off
- Cursor hidden
- Safe exit sequence

### 10.3 Provisioning

- Device identity generation
- Initial config bootstrap
- Optional "pairing" with cloud

**Outcome:** `@edgeflowjs/cli` deploy + `edgeflow doctor`.

---

## 11. Security Model

- Local API protected (token + localhost-only + origin checks)
- Maintenance session TTL
- Signed updates and signed maintenance tokens
- Secrets storage strategy (file permissions, optional TPM later)

**Outcome:** SECURITY.md + threat model notes.

---

## 12. Reference App (End-to-End)

Build `apps/example-kiosk` that uses everything:

- **Flow:** idle → scan → action → thankyou → reset
- **Device:** QR simulated via serial inject; relay simulated via GPIO
- **Sync:** outbox events synced to a dummy endpoint
- **Maintenance:** unlock via QR token; run a "test relay" action; export diagnostics
- **OTA:** simulate update install + rollback

This app becomes the integration test harness.

---

## 13. Implementation Order (Most Efficient)

1. Core + Bridge (UI↔core)
2. Flow engine (minimal) + persistence
3. Device ports + simulator
4. Reference app basic flow
5. Sync outbox + local SQLite
6. Observability baseline
7. Maintenance panel + audit log
8. OTA basic package + rollback simulation
9. CLI deploy + doctor

---

## 14. What Cursor Should Generate First

Initial repo scaffolding with:

- packages + build tooling (pnpm + tsup)
- Boundary lint rules
- Core app bootstrap
- Minimal flow engine skeleton
- Device simulator skeleton
- Example app that runs locally

Once that's in place, iterate module by module.
