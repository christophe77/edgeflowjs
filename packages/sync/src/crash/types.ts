export type CrashReportEntry = {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  instanceId?: string;
};

export type CrashStore = {
  report(evt: { message: string; stack?: string; timestamp?: number; instanceId?: string }): Promise<void>;
  list(limit?: number): Promise<CrashReportEntry[]>;
};
