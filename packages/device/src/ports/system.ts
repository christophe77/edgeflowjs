export type SystemPort = {
  reboot(): Promise<void>;
  shutdown(): Promise<void>;
  uptimeMs(): Promise<number>;
  serviceStatus(name: string): Promise<"active" | "inactive" | "failed" | "unknown">;
};
