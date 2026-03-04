import type { Logger } from "@edgeflowjs/observability";
import type { DeviceApi, DeviceAdapter } from "@edgeflowjs/device";
import type { FlowEngine } from "@edgeflowjs/flow";
import type { SyncEngine } from "@edgeflowjs/sync";
import type { MaintenanceService } from "@edgeflowjs/maintenance";
import type { OtaService } from "@edgeflowjs/ota";
import type { BridgeServer } from "@edgeflowjs/bridge";
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
    syncStore: import("@edgeflowjs/sync").SyncStore;
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
