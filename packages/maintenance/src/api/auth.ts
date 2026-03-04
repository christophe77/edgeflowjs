export type MaintenanceSession = {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  method: "qr" | "usb" | "button" | "remote";
  subject?: string;
};

export type MaintenanceAuth = {
  unlock(input: { method: MaintenanceSession["method"]; token: string }): Promise<MaintenanceSession>;
  validate(sessionId: string): Promise<MaintenanceSession | null>;
  revoke(sessionId: string): Promise<void>;
};

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const sessions = new Map<string, MaintenanceSession>();

export function createMaintenanceAuth(): MaintenanceAuth {
  return {
    async unlock(input) {
      if (!input.token?.trim()) throw new Error("Token required");
      const session: MaintenanceSession = {
        sessionId: crypto.randomUUID(),
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS,
        method: input.method,
      };
      sessions.set(session.sessionId, session);
      return session;
    },
    async validate(sessionId) {
      const s = sessions.get(sessionId);
      if (!s || s.expiresAt < Date.now()) return null;
      return s;
    },
    async revoke(sessionId) {
      sessions.delete(sessionId);
    },
  };
}
