/**
 * Runnable EdgeFlow core: starts logger, device sim, sync, flow, maintenance, OTA, bridge.
 * Loads a single .env from repo root (or cwd). Usage: pnpm dev (from root) or pnpm run dev (from packages/core)
 */
import path from "node:path";
import fs from "node:fs";
import { config as loadEnv } from "dotenv";
import { createLogger, createMetrics, createTraceId } from "@edgeflowjs/observability";

const rootEnv = path.resolve(process.cwd(), "../../.env");
const cwdEnv = path.resolve(process.cwd(), ".env");
const envPath = [cwdEnv, rootEnv].find((p) => fs.existsSync(p));
if (envPath) loadEnv({ path: envPath });
import { createSimDevice, simBusSubscribe } from "@edgeflowjs/device-sim";
import { detectPi, createRpiDevice } from "@edgeflowjs/device-rpi";
import type { DeviceAdapter } from "@edgeflowjs/device";
import { createSqliteStore, createMemoryStore, createSyncEngine, createSqliteCrashStore, createFileCrashStore } from "@edgeflowjs/sync";
import type { SyncStore, CrashStore } from "@edgeflowjs/sync";
import { createMemoryFlowStore, createFlowEngine, defineFlow } from "@edgeflowjs/flow";
import { createMaintenanceAuth, createMaintenanceService } from "@edgeflowjs/maintenance";
import { createOtaService } from "@edgeflowjs/ota";
import { createBridgeServer } from "@edgeflowjs/bridge";
import type { BridgeRequest, BridgeResponse } from "@edgeflowjs/bridge";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "edgeflow.sqlite");

const logger = createLogger({ level: "info" });
const metrics = createMetrics();
let device: DeviceAdapter;
let syncStore: SyncStore;
let crashStore: CrashStore;
const forceMemoryStore = process.env.SYNC_STORE === "memory";
if (forceMemoryStore) {
  syncStore = createMemoryStore();
  crashStore = createFileCrashStore(path.join(DATA_DIR, "crash_reports.json"));
} else {
  try {
    syncStore = createSqliteStore(DB_PATH);
    crashStore = createSqliteCrashStore(DB_PATH);
  } catch (err) {
    logger.warn("SQLite unavailable, using in-memory sync store", {
      hint: "Set SYNC_STORE=memory to skip SQLite and avoid this warning. On Windows, try: npm rebuild better-sqlite3",
    });
    syncStore = createMemoryStore();
    crashStore = createFileCrashStore(path.join(DATA_DIR, "crash_reports.json"));
  }
}

process.on("uncaughtException", async (err) => {
  logger.error("Uncaught exception", { err: err.message, stack: err.stack });
  try {
    await crashStore.report({ message: err.message, stack: err.stack, timestamp: Date.now() });
  } catch (_) {}
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
  try {
    await crashStore.report({ message: `Unhandled rejection: ${String(reason)}`, timestamp: Date.now() });
  } catch (_) {}
});

const BRIDGE_PORT = Number(process.env.BRIDGE_PORT) || 19707;
const bridge = createBridgeServer({ port: BRIDGE_PORT, logger, metrics });
let flow: import("@edgeflowjs/flow").FlowEngine;
let sync: import("@edgeflowjs/sync").SyncEngine;
let maintenance: import("@edgeflowjs/maintenance").MaintenanceService;
let ota: import("@edgeflowjs/ota").OtaService;

async function main() {
  device = detectPi() ? await createRpiDevice() : createSimDevice();

  const flowStore = createMemoryFlowStore();
  flow = createFlowEngine(flowStore);
  flow.register(
    defineFlow({
      id: "purchase",
      initial: "idle",
      states: {
        idle: { on: { START: "scan" } },
        scan: {
          timeoutMs: 30000,
          onTimeout: "TIMEOUT",
          on: { QR_DETECTED: "action", CANCEL: "idle", TIMEOUT: "idle" },
        },
        action: { on: { COMPLETE: "thankYou" } },
        thankYou: {
          timeoutMs: 5000,
          onTimeout: "TIMEOUT",
          on: { TIMEOUT: "idle" },
        },
      },
    })
  );

  const syncSinkUrl = process.env.SYNC_SINK_URL;
  sync = createSyncEngine(syncStore, {
    sinkUrl: syncSinkUrl || undefined,
    onPublish(stats) {
      bridge.publish({
        id: crypto.randomUUID(),
        type: "sync.outbox.updated",
        ts: Date.now(),
        payload: stats,
      });
    },
  });
  sync.onStats((s) => {
    metrics.gauge("outbox_pending", s.pending);
    metrics.gauge("outbox_failed", s.failed);
    bridge.publish({
      id: crypto.randomUUID(),
      type: "sync.outbox.updated",
      ts: Date.now(),
      payload: s,
    });
  });

  ota = createOtaService({ manifestUrl: process.env.OTA_MANIFEST_URL });
  ota.onStatus((s) => {
    bridge.publish({
      id: crypto.randomUUID(),
      type: "ota.status",
      ts: Date.now(),
      payload: { state: s.state, version: "version" in s ? s.version : undefined },
    });
  });

  const runActionImpl = async (
    action: string,
    input?: unknown
  ): Promise<{ ok: boolean; data?: unknown; error?: string }> => {
    const inp = input as Record<string, unknown> | undefined;
    if (action === "device.testGpio") {
      const pin = (inp?.pin as number) ?? 17;
      const sim = device as { getGpio?: (p: number) => boolean; setGpio?: (p: number, v: boolean) => Promise<void> };
      if (sim.getGpio && sim.setGpio) {
        const current = sim.getGpio(pin);
        await sim.setGpio(pin, !current);
        return { ok: true, data: { pin, value: !current } };
      }
      await device.gpio.open(pin, "out");
      const current = await device.gpio.read(pin);
      await device.gpio.write(pin, !current);
      return { ok: true, data: { pin, value: !current } };
    }
    if (action === "device.injectSerial") {
      const sim = device as { injectSerial?: (port: string, data: string) => void };
      if (sim.injectSerial) {
        const port = (inp?.port as string) ?? "/dev/ttyUSB0";
        const data = (inp?.data as string) ?? "QR:123456";
        sim.injectSerial(port, data);
        return { ok: true, data: { port, data } };
      }
      return { ok: false, error: "injectSerial not available on real hardware" };
    }
    if (action === "sync.retry") {
      await sync.retry();
      const s = await sync.stats();
      return { ok: true, data: s };
    }
    if (action === "system.reboot") {
      logger.info("reboot requested");
      return { ok: true, data: { message: "reboot requested (no-op in MVP)" } };
    }
    if (action === "ota.check") {
      const result = await ota.check();
      return { ok: true, data: result };
    }
    return { ok: false, error: `Unknown action: ${action}` };
  };

  maintenance = createMaintenanceService(createMaintenanceAuth(), runActionImpl);

  flow.onTransition((t) => {
    metrics.counter("flow_transitions_total", 1);
    bridge.publish({
      id: crypto.randomUUID(),
      type: "flow.transition",
      ts: Date.now(),
      payload: {
        instanceId: t.instanceId,
        from: t.from,
        to: t.to,
        eventType: t.event.type,
      },
    });
  });

  if (!detectPi()) {
    simBusSubscribe((evt) => {
      if (evt.type === "device.network.changed") {
        bridge.publish({
          id: crypto.randomUUID(),
          type: "device.network.changed",
          ts: Date.now(),
          payload: { online: evt.online, kind: evt.kind },
        });
      }
      if (evt.type === "device.serial.received") {
        bridge.publish({
          id: crypto.randomUUID(),
          type: "device.serial.received",
          ts: Date.now(),
          payload: { port: evt.port, data: evt.data },
        });
      }
    });
  }

  bridge.setRequestHandler(async (req, respond) => {
    const requestId = req.id;
    const traceId = (req as { traceId?: string }).traceId ?? createTraceId();
    const reqLogger = logger.child({ traceId });
    const send = (res: BridgeResponse) =>
      respond({ ...res, traceId: res.traceId ?? traceId } as BridgeResponse);
    try {
      if (req.type === "flow.getSnapshot") {
        const snapshot = await flow.getSnapshot(req.payload.instanceId);
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: snapshot },
        });
        return;
      }
      if (req.type === "flow.dispatch") {
        const snapshot = await flow.dispatch(req.payload.instanceId, req.payload.event);
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: snapshot },
        });
        return;
      }
      if (req.type === "maintenance.unlock") {
        const session = await maintenance.auth.unlock({
          method: req.payload.method,
          token: req.payload.token,
        });
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: session },
        });
        return;
      }
      if (req.type === "maintenance.action") {
        const result = await maintenance.runAction(
          req.payload.sessionId,
          req.payload.action,
          req.payload.input
        );
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: result },
        });
        return;
      }
      if (req.type === "sync.outbox.list") {
        const list = await syncStore.outboxList({
          status: req.payload.status,
          limit: req.payload.limit ?? 100,
        });
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: list },
        });
        return;
      }
      if (req.type === "sync.outbox.retry") {
        await sync.retry(req.payload.ids);
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId },
        });
        return;
      }
      if (req.type === "crash.list") {
        const list = await crashStore.list(req.payload.limit ?? 20);
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: list },
        });
        return;
      }
      if (req.type === "ota.check") {
        const result = await ota.check();
        send({
          id: crypto.randomUUID(),
          type: "ok",
          ts: Date.now(),
          payload: { requestId, data: result },
        });
        return;
      }
      send({
        id: crypto.randomUUID(),
        type: "error",
        ts: Date.now(),
        payload: { requestId, code: "UNKNOWN", message: `Unknown request type: ${(req as BridgeRequest).type}` },
      });
    } catch (e) {
      reqLogger.warn("Request error", { err: String(e) });
      send({
        id: crypto.randomUUID(),
        type: "error",
        ts: Date.now(),
        payload: { requestId, code: "ERROR", message: String(e) },
      });
    }
  });

  await sync.start();
  await bridge.start();

  const instanceId = "purchase-1";
  await flow.start("purchase", { instanceId, ctx: {} });
  logger.info("EdgeFlow core running", { instanceId, bridgePort: BRIDGE_PORT });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down…");
    await bridge.stop();
    await sync.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
