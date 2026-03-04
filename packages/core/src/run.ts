/**
 * Runnable EdgeFlow core: starts logger, device sim, sync, flow, maintenance, OTA, bridge.
 * Loads a single .env from repo root (or cwd). Usage: pnpm dev (from root) or pnpm run dev (from packages/core)
 */
import path from "node:path";
import fs from "node:fs";
import { config as loadEnv } from "dotenv";
import { createLogger } from "@edgeflow/observability";

const rootEnv = path.resolve(process.cwd(), "../../.env");
const cwdEnv = path.resolve(process.cwd(), ".env");
const envPath = [cwdEnv, rootEnv].find((p) => fs.existsSync(p));
if (envPath) loadEnv({ path: envPath });
import { createSimDevice, simBusSubscribe } from "@edgeflow/device-sim";
import { createSqliteStore, createMemoryStore, createSyncEngine, createSqliteCrashStore, createFileCrashStore } from "@edgeflow/sync";
import type { SyncStore, CrashStore } from "@edgeflow/sync";
import { createMemoryFlowStore, createFlowEngine, defineFlow } from "@edgeflow/flow";
import { createMaintenanceAuth, createMaintenanceService } from "@edgeflow/maintenance";
import { createOtaService } from "@edgeflow/ota";
import { createBridgeServer } from "@edgeflow/bridge";
import type { BridgeRequest, BridgeResponse } from "@edgeflow/bridge";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "edgeflow.sqlite");

const logger = createLogger({ level: "info" });
const device = createSimDevice();
let syncStore: SyncStore;
let crashStore: CrashStore;
try {
  syncStore = createSqliteStore(DB_PATH);
  crashStore = createSqliteCrashStore(DB_PATH);
} catch {
  logger.warn("SQLite unavailable, using in-memory sync store");
  syncStore = createMemoryStore();
  crashStore = createFileCrashStore(path.join(DATA_DIR, "crash_reports.json"));
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
const bridge = createBridgeServer({ port: BRIDGE_PORT, logger });
let flow: import("@edgeflow/flow").FlowEngine;
let sync: import("@edgeflow/sync").SyncEngine;
let maintenance: import("@edgeflow/maintenance").MaintenanceService;
let ota: import("@edgeflow/ota").OtaService;

async function main() {
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

  sync = createSyncEngine(syncStore, {
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
    bridge.publish({
      id: crypto.randomUUID(),
      type: "sync.outbox.updated",
      ts: Date.now(),
      payload: s,
    });
  });

  ota = createOtaService();
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
      const current = device.getGpio(pin);
      await device.setGpio(pin, !current);
      return { ok: true, data: { pin, value: !current } };
    }
    if (action === "device.injectSerial") {
      const port = (inp?.port as string) ?? "/dev/ttyUSB0";
      const data = (inp?.data as string) ?? "QR:123456";
      device.injectSerial(port, data);
      return { ok: true, data: { port, data } };
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

  bridge.setRequestHandler(async (req, respond) => {
    const requestId = req.id;
    const send = (res: BridgeResponse) => respond(res);
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
