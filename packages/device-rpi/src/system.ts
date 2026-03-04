import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { SystemPort } from "@edgeflowjs/device";

const execAsync = promisify(exec);

export function createSystemPort(): SystemPort {
  return {
    async reboot() {
      await execAsync("sudo reboot");
    },
    async shutdown() {
      await execAsync("sudo shutdown -h now");
    },
    async uptimeMs() {
      const uptime = process.uptime();
      return Math.floor(uptime * 1000);
    },
    async serviceStatus(name) {
      try {
        const { stdout } = await execAsync(`systemctl is-active ${name}`);
        const s = stdout.trim();
        if (s === "active") return "active";
        if (s === "inactive") return "inactive";
        if (s === "failed") return "failed";
        return "unknown";
      } catch {
        return "unknown";
      }
    },
  };
}
