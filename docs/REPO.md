1) Monorepo file tree (pnpm + tsup + eslint boundaries)
edgeflow/
  README.md
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .editorconfig
  .gitignore

  configs/
    eslint/
      eslint.config.mjs
      boundaries.rules.mjs
    tsup/
      tsup.base.ts

  scripts/
    postinstall.mjs

  packages/
    core/
      package.json
      tsconfig.json
      src/
        index.ts
        run.ts
        app/
          createEdgeflowApp.ts
          plugin.ts
        config/
          schema.ts
          loadConfig.ts

    bridge/
      package.json
      tsconfig.json
      src/
        index.ts
        protocol/
          messages.ts
          events.ts
          envelope.ts
        server/
          createBridgeServer.ts
        client/
          createBridgeClient.ts

    flow/
      package.json
      tsconfig.json
      src/
        index.ts
        api/
          types.ts
          defineFlow.ts
          runtime.ts
          store.ts
          snapshot.ts

    device/
      package.json
      tsconfig.json
      src/
        index.ts
        ports/
          gpio.ts
          serial.ts
          usb.ts
          network.ts
          system.ts
          display.ts
          storage.ts
          time.ts
          identity.ts
        api/
          device.ts
          events.ts

    device-sim/
      package.json
      tsconfig.json
      src/
        index.ts
        sim/
          createSimDevice.ts
          simBus.ts

    sync/
      package.json
      tsconfig.json
      src/
        index.ts
        api/
          types.ts
          outbox.ts
          client.ts
        sqlite/
          createSqliteStore.ts
        memory/
          createMemoryStore.ts

    observability/
      package.json
      tsconfig.json
      src/
        index.ts
        api/
          logger.ts
          metrics.ts
          trace.ts
          redact.ts

    maintenance/
      package.json
      tsconfig.json
      src/
        index.ts
        api/
          auth.ts
          actions.ts
          audit.ts

    ota/
      package.json
      tsconfig.json
      src/
        index.ts
        api/
          manifest.ts
          verifier.ts
          updater.ts

    cli/
      package.json
      tsconfig.json
      src/
        index.ts
        commands/
          init.ts
          dev.ts
          build.ts
          simulate.ts
          deploy.ts
          logs.ts
          restart.ts
          update.ts
          doctor.ts
          killPorts.ts
        deploy/
          createBundle.ts
        lib/
          config.ts
          detectPi.ts

    create-edgeflow/
      package.json
      tsconfig.json
      src/
        index.ts
      template/
        package.json
        vite.config.ts
        tsconfig.json
        index.html
        src/
          main.tsx
          App.tsx
          index.css
          bridge/
          components/
          screens/
          locales/
          hooks/

    ui-devtools/
      package.json
      tsconfig.json
      src/
        index.ts
        FlowTimeline.tsx
        OutboxInspector.tsx
        CrashReports.tsx

    ui-kit/
      package.json
      tsconfig.json
      src/
        index.ts
        components/
          KioskButton.tsx
          AttractLoop.tsx

    i18n/
      package.json
      tsconfig.json
      src/
        index.ts
        React.tsx

  apps/
    devtools/
      package.json
      vite.config.ts
      src/
        main.tsx
        App.tsx
    example-kiosk/
      package.json
      tsconfig.json
      index.html
      vite.config.ts
      src/
        main.tsx
        App.tsx
        flows/
          purchaseFlow.ts
        bridge/
          bridgeClient.ts
        screens/
          Idle.tsx
          Scan.tsx
          Action.tsx
          ThankYou.tsx
          Maintenance.tsx

Design notes (implicit in the tree):

UI (apps/example-kiosk) consumes only @edgeflowjs/bridge + @edgeflowjs/flow types.

Core composes everything and exposes a local API via bridge.

device-sim is mandatory for DX and tests.

2) Public TypeScript interfaces (MVP)
2.1 @edgeflowjs/core — app bootstrap + plugins
// packages/core/src/app/plugin.ts
export type EdgeflowPlugin = {
  name: string;
  start(ctx: EdgeflowContext): Promise<void>;
  stop?(ctx: EdgeflowContext): Promise<void>;
};

export type EdgeflowContext = {
  config: Record<string, unknown>;
  logger: import("@edgeflowjs/observability").Logger;
  device: import("@edgeflowjs/device").DeviceApi;
  flow: import("@edgeflowjs/flow").FlowEngine;
  sync: import("@edgeflowjs/sync").SyncEngine;
  maintenance: import("@edgeflowjs/maintenance").MaintenanceService;
  ota: import("@edgeflowjs/ota").OtaService;
  bridge: import("@edgeflowjs/bridge").BridgeServer;
};

// packages/core/src/app/createEdgeflowApp.ts
export type EdgeflowAppOptions = {
  configPath?: string;
  plugins?: EdgeflowPlugin[];
  adapters: {
    device: import("@edgeflowjs/device").DeviceAdapter;
    syncStore: import("@edgeflowjs/sync").SyncStore;
  };
};

export type EdgeflowApp = {
  start(): Promise<void>;
  stop(): Promise<void>;
};

export function createEdgeflowApp(opts: EdgeflowAppOptions): EdgeflowApp;

// packages/core/src/config/loadConfig.ts
export function loadConfig(opts?: { configPath?: string }): Promise<EdgeflowConfig>;

// packages/core/src/config/schema.ts
export type EdgeflowConfig = { bridge?: { port?: number }; [key: string]: unknown };

// packages/core/src/run.ts — standalone entry point (node packages/core/dist/run.js)
2.2 @edgeflowjs/bridge — protocol UI ↔ core
// packages/bridge/src/protocol/envelope.ts
export type Envelope<TType extends string, TPayload> = {
  id: string;               // uuid
  type: TType;
  ts: number;               // epoch ms
  payload: TPayload;
  traceId?: string;
};

// packages/bridge/src/protocol/messages.ts
export type BridgeRequest =
  | Envelope<"ping", object>
  | Envelope<"flow.getSnapshot", { instanceId: string }>
  | Envelope<"flow.dispatch", { instanceId: string; event: { type: string; payload?: unknown } }>
  | Envelope<"maintenance.unlock", { method: "qr" | "usb" | "button" | "remote"; token: string }>
  | Envelope<"maintenance.action", { sessionId: string; action: string; input?: unknown }>
  | Envelope<"sync.outbox.list", { limit?: number; status?: "pending" | "failed" | "sent" }>
  | Envelope<"sync.outbox.retry", { ids: string[] }>
  | Envelope<"ota.check", object>
  | Envelope<"ota.apply", { version: string }>;

export type BridgeResponse =
  | Envelope<"pong", { requestId?: string }>
  | Envelope<"ok", { requestId: string; data?: unknown }>
  | Envelope<"error", { requestId: string; code: string; message: string; details?: unknown }>;

// packages/bridge/src/protocol/events.ts
export type BridgeEvent =
  | Envelope<"device.network.changed", { online: boolean; kind?: string }>
  | Envelope<"device.serial.received", { port: string; data: string }>
  | Envelope<"flow.transition", { instanceId: string; from: string; to: string; eventType: string }>
  | Envelope<"sync.outbox.updated", { pending: number; failed: number }>
  | Envelope<"ota.status", { state: "idle" | "downloading" | "verifying" | "applying" | "rollback" | "done"; version?: string }>
  | Envelope<"log", { level: "debug" | "info" | "warn" | "error"; msg: string; meta?: unknown }>;

// packages/bridge/src/index.ts
export type BridgeServer = {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(evt: BridgeEvent): void;
};

export type BridgeClient = {
  request<T = unknown>(req: BridgeRequest): Promise<T>;
  subscribe(handler: (evt: BridgeEvent) => void): () => void;
};

export function createBridgeServer(opts: { port: number; logger: import("@edgeflowjs/observability").Logger }): BridgeServer;
export function createBridgeClient(opts: { url: string; token?: string }): BridgeClient;

Recommended MVP transport: WebSocket (simple + event push). You can migrate to unix socket later without changing types.

2.3 @edgeflowjs/flow — state machine + runtime + store
// packages/flow/src/api/types.ts
export type FlowEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  payload?: TPayload;
};

export type TransitionGuard<TCtx> = (ctx: TCtx, evt: FlowEvent) => boolean | Promise<boolean>;
export type TransitionAction<TCtx> = (ctx: TCtx, evt: FlowEvent) => void | Promise<void>;

export type FlowStateDef<TCtx> = {
  on?: Record<
    string,
    | string
    | {
        target: string;
        guard?: TransitionGuard<TCtx>;
        action?: TransitionAction<TCtx>;
      }
  >;
  timeoutMs?: number;
  onTimeout?: string; // event type emitted when timeout triggers (e.g. "TIMEOUT")
  entry?: TransitionAction<TCtx>;
  exit?: TransitionAction<TCtx>;
};

export type FlowDef<TCtx> = {
  id: string;
  initial: string;
  states: Record<string, FlowStateDef<TCtx>>;
  version?: string;
};

export type FlowInstanceSnapshot<TCtx> = {
  instanceId: string;
  flowId: string;
  state: string;
  ctx: TCtx;
  updatedAt: number;
};

// packages/flow/src/api/store.ts
export type FlowStore = {
  load(instanceId: string): Promise<FlowInstanceSnapshot<any> | null>;
  save(snapshot: FlowInstanceSnapshot<any>): Promise<void>;
};

// packages/flow/src/api/runtime.ts
export type FlowEngine = {
  register<TCtx>(def: FlowDef<TCtx>): void;
  start<TCtx>(flowId: string, opts: { instanceId: string; ctx: TCtx }): Promise<FlowInstanceSnapshot<TCtx>>;
  dispatch(instanceId: string, evt: FlowEvent): Promise<FlowInstanceSnapshot<any>>;
  getSnapshot(instanceId: string): Promise<FlowInstanceSnapshot<any> | null>;
  onTransition(handler: (t: { instanceId: string; from: string; to: string; event: FlowEvent }) => void): () => void;
};

MVP: snapshot persistence + simple timers (setTimeout) + rehydration at boot. V2: durable timers and full event log.

2.4 @edgeflowjs/device — ports + adapter + API
// packages/device/src/ports/gpio.ts
export type GpioDirection = "in" | "out";
export type GpioEdge = "rising" | "falling" | "both";

export type GpioPort = {
  open(pin: number, direction: GpioDirection): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  watch(pin: number, edge: GpioEdge, handler: (value: boolean) => void): Promise<() => void>;
  close(pin: number): Promise<void>;
};

// packages/device/src/ports/serial.ts
export type SerialPortConfig = { baudRate: number };
export type SerialPort = {
  open(path: string, cfg: SerialPortConfig): Promise<void>;
  send(path: string, data: Uint8Array): Promise<void>;
  onData(path: string, handler: (data: Uint8Array) => void): Promise<() => void>;
  close(path: string): Promise<void>;
};

// packages/device/src/ports/network.ts
export type NetworkStatus = { online: boolean; kind?: "ethernet" | "wifi" | "cellular" | "unknown" };
export type NetworkPort = {
  status(): Promise<NetworkStatus>;
  onChange(handler: (s: NetworkStatus) => void): Promise<() => void>;
};

// packages/device/src/ports/system.ts
export type SystemPort = {
  reboot(): Promise<void>;
  shutdown(): Promise<void>;
  uptimeMs(): Promise<number>;
  serviceStatus(name: string): Promise<"active" | "inactive" | "failed" | "unknown">;
};

// packages/device/src/ports/identity.ts
export type IdentityPort = {
  deviceId(): Promise<string>;      // stable id (file-based for MVP)
  hwRevision(): Promise<string | null>;
};

// packages/device/src/api/device.ts
export type DeviceApi = {
  gpio: GpioPort;
  serial: SerialPort;
  network: NetworkPort;
  system: SystemPort;
  identity: IdentityPort;
};

export type DeviceAdapter = DeviceApi; // MVP = adapter provides the ports directly

// packages/device/src/api/events.ts
export type DeviceEvent =
  | { type: "device.network.changed"; online: boolean; kind?: string }
  | { type: "device.serial.received"; port: string; data: string }
  | { type: "device.gpio.edge"; pin: number; value: boolean };

2.5 @edgeflowjs/sync — SQLite store + outbox + memory fallback
// packages/sync/src/api/types.ts
export type OutboxStatus = "pending" | "sent" | "failed";

export type OutboxEvent = {
  id: string;                 // uuid
  type: string;
  payload: unknown;
  occurredAt: number;         // epoch ms
  idempotencyKey: string;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt?: number;
  lastError?: string;
  traceId?: string;
};

export type SyncStore = {
  outboxEnqueue(evt: Omit<OutboxEvent, "status" | "retryCount">): Promise<OutboxEvent>;
  outboxList(filter?: { status?: OutboxStatus; limit?: number }): Promise<OutboxEvent[]>;
  outboxMarkSent(id: string): Promise<void>;
  outboxMarkFailed(id: string, err: string, nextRetryAt: number): Promise<void>;
  outboxDelete(id: string): Promise<void>;
  close(): Promise<void>;
};

export function createSqliteStore(dbPath: string): SyncStore;
export function createMemoryStore(): SyncStore;  // fallback for tests / SQLite unavailable

export type SyncEngine = {
  start(): Promise<void>;
  stop(): Promise<void>;
  enqueue(type: string, payload: unknown, opts: { idempotencyKey: string; traceId?: string }): Promise<OutboxEvent>;
  stats(): Promise<{ pending: number; failed: number }>;
  retry(ids?: string[]): Promise<void>;
  onStats(handler: (s: { pending: number; failed: number }) => void): () => void;
};

MVP : endpoint “sink” configurable (POST /events) + retry backoff.

2.6 @edgeflowjs/observability — logger minimal + redaction
// packages/observability/src/api/logger.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  child(meta: Record<string, unknown>): Logger;
  log(level: LogLevel, msg: string, meta?: unknown): void;
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
};

export function createLogger(opts: { level: LogLevel; redactionKeys?: string[]; filePath?: string }): Logger;
export function redactKeys(obj: unknown, keys: string[]): unknown;
2.7 @edgeflowjs/maintenance — unlock + actions + audit
// packages/maintenance/src/api/auth.ts
export type MaintenanceSession = {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  method: "qr" | "usb" | "button" | "remote";
  subject?: string; // optional operator id
};

export type MaintenanceAuth = {
  unlock(input: { method: MaintenanceSession["method"]; token: string }): Promise<MaintenanceSession>;
  validate(sessionId: string): Promise<MaintenanceSession | null>;
  revoke(sessionId: string): Promise<void>;
};

// packages/maintenance/src/api/actions.ts
export type MaintenanceActionResult = { ok: boolean; data?: unknown; error?: string };

export type MaintenanceService = {
  auth: MaintenanceAuth;
  runAction(sessionId: string, action: string, input?: unknown): Promise<MaintenanceActionResult>;
  listActions(): Promise<{ action: string; description: string }[]>;
};

export type AuditEntry = { id: string; action: string; sessionId: string; payload?: unknown; ts: number };
export function auditRecord(action: string, sessionId: string, payload?: unknown): Promise<void>;
export function auditGetRecent(limit?: number): Promise<AuditEntry[]>;

MVP actions : device.testGpio, device.injectSerial, sync.retry, system.reboot, ota.check.

2.8 @edgeflowjs/ota — manifest + service
// packages/ota/src/api/manifest.ts
export type OtaManifest = {
  version: string;
  publishedAt: number;
  minHwRevision?: string;
  entrypoint: string;     // path to main file in package
  sha256: string;
  signature: string;      // base64 signature of manifest+sha256
};

// packages/ota/src/api/updater.ts
export type OtaStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "downloading"; version: string; progress: number }
  | { state: "verifying"; version: string }
  | { state: "applying"; version: string }
  | { state: "rollback"; version: string; reason: string }
  | { state: "done"; version: string };

export type OtaService = {
  check(): Promise<{ available: boolean; manifest?: OtaManifest }>;
  apply(version: string): Promise<void>;
  status(): Promise<OtaStatus>;
  onStatus(handler: (s: OtaStatus) => void): () => void;
};

export function verifyManifest(manifest: OtaManifest, publicKey?: string): Promise<boolean>;

2.9 @edgeflowjs/device-sim — simulator for DX and tests
// packages/device-sim/src/sim/createSimDevice.ts
export type SimDevice = DeviceAdapter & {
  setNetworkOnline(online: boolean): void;
  injectSerial(port: string, data: string): void;
  setGpio(pin: number, value: boolean): void;
  getGpio(pin: number): boolean;
};

export function createSimDevice(): SimDevice;
export function simBusSubscribe(handler: (evt: { type: string; payload?: unknown }) => void): () => void;

2.10 @edgeflowjs/i18n — I18n, createI18n, React exports

2.11 create-edgeflow — scaffold new kiosk project
// packages/create-edgeflow/src/index.ts
// Usage: npx @edgeflowjs/create-edgeflow <project-name> or npx @edgeflowjs/create-edgeflow .
// Copies template from packages/create-edgeflow/template/, runs pnpm install
// Template uses @edgeflowjs/core, @edgeflowjs/bridge, @edgeflowjs/flow, @edgeflowjs/i18n from npm

2.12 @edgeflowjs/cli — init, dev, build, deploy, logs, restart, doctor
// edgeflow init [name] — runs create-edgeflow
// edgeflow deploy --host <ip> — works for monorepo and standalone (detects via getProjectRoot, getRuntimePath, getKioskDistPath)
// packages/i18n/src/index.ts
export type Locale = string;
export type Translations = Record<string, string | Record<string, string>>;

export type I18n = {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, params?: Record<string, string | number>): string;
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(n: number, options?: Intl.NumberFormatOptions): string;
};

export function createI18n(opts: {
  defaultLocale: Locale;
  translations: Record<Locale, Translations>;
  onLocaleChange?: (locale: Locale) => void;
}): I18n;

// packages/i18n/src/React.tsx
export function I18nProvider(props: { i18n: I18n; children: ReactNode }): JSX.Element;
export function useI18n(): I18n;
export function useT(): (key: string, params?: Record<string, string | number>) => string;