import type { Logger } from "@edgeflow/observability";
import type { DeviceApi, DeviceAdapter } from "@edgeflow/device";
import type { FlowEngine } from "@edgeflow/flow";
import type { SyncEngine } from "@edgeflow/sync";
import type { MaintenanceService } from "@edgeflow/maintenance";
import type { OtaService } from "@edgeflow/ota";
import type { BridgeServer } from "@edgeflow/bridge";
import type { EdgeflowPlugin } from "./plugin.js";

export type EdgeflowContext = {
  config: Record<string, unknown>;
  logger: Logger;
  device: DeviceApi;
  flow: FlowEngine;
  sync: SyncEngine;
  maintenance: MaintenanceService;
  ota: OtaService;
  bridge: BridgeServer;
};

export type EdgeflowAppOptions = {
  configPath?: string;
  plugins?: EdgeflowPlugin[];
  adapters: {
    device: DeviceAdapter;
    syncStore: import("@edgeflow/sync").SyncStore;
  };
};

export type EdgeflowApp = {
  start(): Promise<void>;
  stop(): Promise<void>;
};

export function createEdgeflowApp(_opts: EdgeflowAppOptions): EdgeflowApp {
  return {
    async start() {},
    async stop() {},
  };
}
