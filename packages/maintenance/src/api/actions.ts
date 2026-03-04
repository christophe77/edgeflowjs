export type MaintenanceActionResult = { ok: boolean; data?: unknown; error?: string };

export type ActionRunner = (
  action: string,
  input?: unknown
) => Promise<MaintenanceActionResult>;
