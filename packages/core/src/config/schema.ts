export type EdgeflowConfig = {
  bridgePort?: number;
  dataDir?: string;
  logLevel?: "debug" | "info" | "warn" | "error";
};

export const DEFAULT_CONFIG: EdgeflowConfig = {
  bridgePort: 19707,
  dataDir: "./data",
  logLevel: "info",
};
