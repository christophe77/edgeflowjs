import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { IdentityPort } from "@edgeflowjs/device";

export function createIdentityPort(): IdentityPort {
  return {
    async deviceId() {
      const paths = ["/etc/machine-id", "/var/lib/dbus/machine-id"];
      for (const p of paths) {
        if (existsSync(p)) {
          return readFileSync(p, "utf8").trim();
        }
      }
      return "unknown-device";
    },
    async hwRevision() {
      const modelPath = "/proc/device-tree/model";
      if (existsSync(modelPath)) {
        const buf = readFileSync(modelPath);
        return buf.toString("utf8").replace(/\0/g, "").trim();
      }
      return null;
    },
  };
}
