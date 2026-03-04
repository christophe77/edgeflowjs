import { Command } from "commander";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function doctorCommand(): Command {
  const cmd = new Command("doctor")
    .description("Validate environment (permissions, ports, config)")
    .action(() => {
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

      console.log("EdgeFlow doctor\n");
      checks.forEach((c) => console.log(`  ${c}`));
      console.log("\nFuture: Raspberry Pi detection, port 19707, permissions.");
    });
  return cmd;
}
