import { Command } from "commander";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function killPortsCommand(): Command {
  const cmd = new Command("kill-ports")
    .description("Kill processes on bridge and Vite ports (19707, 19708, 5173, 5174)")
    .action(() => {
      const root = path.resolve(__dirname, "../../..");
      const result = spawnSync("node", ["scripts/kill-ports.mjs"], {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      process.exit(result.status ?? 0);
    });
  return cmd;
}
