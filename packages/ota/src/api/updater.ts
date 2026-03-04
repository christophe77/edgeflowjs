export type OtaStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "downloading"; version: string; progress: number }
  | { state: "verifying"; version: string }
  | { state: "applying"; version: string }
  | { state: "rollback"; version: string; reason: string }
  | { state: "done"; version: string };

export type OtaService = {
  check(): Promise<{ available: boolean; manifest?: import("./manifest.js").OtaManifest }>;
  apply(version: string): Promise<void>;
  status(): Promise<OtaStatus>;
  onStatus(handler: (s: OtaStatus) => void): () => void;
};

const statusHandlers: Array<(s: OtaStatus) => void> = [];
let currentStatus: OtaStatus = { state: "idle" };

function emitStatus(s: OtaStatus) {
  currentStatus = s;
  for (const h of statusHandlers) h(s);
}

export function createOtaService(): OtaService {
  return {
    async check() {
      emitStatus({ state: "checking" });
      await new Promise((r) => setTimeout(r, 100));
      emitStatus({ state: "idle" });
      return { available: false };
    },
    async apply(_version) {
      emitStatus({ state: "applying", version: "0.0.0" });
      await new Promise((r) => setTimeout(r, 500));
      emitStatus({ state: "done", version: "0.0.0" });
    },
    async status() {
      return currentStatus;
    },
    onStatus(handler) {
      statusHandlers.push(handler);
      return () => {
        const i = statusHandlers.indexOf(handler);
        if (i >= 0) statusHandlers.splice(i, 1);
      };
    },
  };
}
