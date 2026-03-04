import { Command } from "commander";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function simulateCommand(): Command {
  const cmd = new Command("simulate")
    .description("Launch with device-sim (core + app)")
    .action(async () => {
      const root = path.resolve(__dirname, "../../..");
      const child = spawn("pnpm", ["run", "dev"], {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, EDGEFLOW_USE_SIM: "1" },
        shell: process.platform === "win32",
      });
      child.on("exit", (code) => process.exit(code ?? 0));
    });
  return cmd;
}
