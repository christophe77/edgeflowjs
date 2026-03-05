import { Command } from "commander";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { detectPi } from "../lib/detectPi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function checkPort19707(): string {
  const isWin = platform() === "win32";
  try {
    if (isWin) {
      const r = spawnSync("netstat", ["-ano"], { encoding: "utf-8" });
      const inUse = r.stdout?.includes(":19707") ?? false;
      return inUse ? "Port 19707: in use" : "Port 19707: free";
    } else {
      const r = spawnSync("lsof", ["-i", ":19707"], { encoding: "utf-8" });
      return r.status === 0 ? "Port 19707: in use" : "Port 19707: free";
    }
  } catch {
    return "Port 19707: (check skipped)";
  }
}

export function doctorCommand(): Command {
  const cmd = new Command("doctor")
    .description("Validate environment (permissions, ports, config)")
    .option("-h, --host <ip>", "Run doctor on remote host via SSH")
    .option("-u, --user <user>", "SSH user (when using --host)", "pi")
    .action((opts) => {
      const host = opts.host;
      if (host) {
        const cmd = `echo "=== Remote doctor ${host} ===" && (node --version 2>/dev/null || echo "Node: not found") && (status=$(systemctl is-active edgeflow 2>/dev/null) && echo "EdgeFlow service: $status" || echo "EdgeFlow service: not installed")`;
        const r = spawnSync("ssh", ["-o", "StrictHostKeyChecking=no", `${opts.user}@${host}`, cmd], {
          stdio: "inherit",
        });
        process.exit(r.status ?? 0);
        return;
      }

      const root = path.resolve(__dirname, "../../..");
      const checks: string[] = [];

      const node = spawnSync("node", ["--version"], { encoding: "utf-8" });
      if (node.status === 0) {
        checks.push(`Node: ${node.stdout.trim()}`);
      } else {
        checks.push("Node: not found");
      }

      const pnpm = spawnSync("pnpm", ["--version"], { cwd: root, encoding: "utf-8" });
      if (pnpm.status === 0) {
        checks.push(`pnpm: ${pnpm.stdout.trim()}`);
      } else {
        checks.push("pnpm: not found");
      }

      const envPath = path.join(root, ".env");
      if (fs.existsSync(envPath)) {
        checks.push(".env: present");
      } else {
        checks.push(".env: missing (optional, copy from .env.example)");
      }

      if (detectPi()) {
        checks.push("Device: Raspberry Pi detected");
      }

      checks.push(checkPort19707());

      console.log("EdgeFlow doctor\n");
      checks.forEach((c) => console.log(`  ${c}`));
    });
  return cmd;
}
