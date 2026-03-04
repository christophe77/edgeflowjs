import type { MaintenanceAuth } from "./auth.js";
import type { MaintenanceActionResult } from "./actions.js";
import { auditRecord } from "./audit.js";

export type MaintenanceService = {
  auth: MaintenanceAuth;
  runAction(sessionId: string, action: string, input?: unknown): Promise<MaintenanceActionResult>;
  listActions(): Promise<{ action: string; description: string }[]>;
};

const BUILTIN_ACTIONS: { action: string; description: string }[] = [
  { action: "device.testGpio", description: "Toggle a GPIO pin (simulator)" },
  { action: "device.injectSerial", description: "Inject serial message" },
  { action: "sync.retry", description: "Trigger sync retry" },
  { action: "system.reboot", description: "Request system reboot" },
  { action: "ota.check", description: "Check for OTA updates" },
];

export function createMaintenanceService(
  auth: MaintenanceAuth,
  runActionImpl: (action: string, input?: unknown) => Promise<MaintenanceActionResult>
): MaintenanceService {
  return {
    auth,
    async runAction(sessionId, action, input) {
      const session = await auth.validate(sessionId);
      if (!session) {
        return { ok: false, error: "Invalid or expired session" };
      }
      try {
        const result = await runActionImpl(action, input);
        auditRecord({
          at: Date.now(),
          sessionId,
          action,
          input,
          outcome: result.ok ? "ok" : "error",
          error: result.error,
        });
        return result;
      } catch (e) {
        auditRecord({
          at: Date.now(),
          sessionId,
          action,
          input,
          outcome: "error",
          error: String(e),
        });
        return { ok: false, error: String(e) };
      }
    },
    async listActions() {
      return BUILTIN_ACTIONS;
    },
  };
}
