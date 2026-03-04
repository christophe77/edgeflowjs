import { spawn } from "node:child_process";
import { platform } from "node:os";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { getProjectRoot } from "../lib/config.js";

const isWin = platform() === "win32";
const LOG_FILE = join("packages", "core", "data", "edgeflow.log");

export function logsCommand(): Command {
  const cmd = new Command("logs")
    .description("Tail EdgeFlow core logs (journalctl on Linux, log file on Windows)")
    .option("-n, --lines <n>", "Number of lines to show", "50")
    .option("-f, --follow", "Follow log output")
    .action((opts) => {
      const root = getProjectRoot();
      const lines = parseInt(opts.lines, 10) || 50;

      if (isWin) {
        const logPath = join(root, LOG_FILE);
        if (!existsSync(logPath)) {
          console.error(`Log file not found: ${logPath}`);
          console.error("On Windows, run the core with output redirected:");
          console.error(`  node packages/core/dist/run.js > ${LOG_FILE} 2>&1`);
          process.exit(1);
        }
        const args = opts.follow
          ? ["-NoProfile", "-Command", `Get-Content -Path "${logPath}" -Tail ${lines} -Wait`]
          : ["-NoProfile", "-Command", `Get-Content -Path "${logPath}" -Tail ${lines}`];
        const proc = spawn("powershell.exe", args, { stdio: "inherit" });
        proc.on("error", (err) => {
          console.error("Failed to run:", err.message);
          process.exit(1);
        });
        proc.on("exit", (code) => process.exit(code ?? 0));
      } else {
        const logPath = join(root, LOG_FILE);
        const runTail = () => {
          const tailArgs = opts.follow ? ["-f", "-n", String(lines), logPath] : ["-n", String(lines), logPath];
          const p = spawn("tail", tailArgs, { stdio: "inherit" });
          p.on("exit", (c) => process.exit(c ?? 0));
        };
        const args = ["-u", "edgeflow", "-n", String(lines)];
        if (opts.follow) args.push("-f");
        const proc = spawn("journalctl", args, { stdio: "inherit" });
        proc.on("error", (err) => {
          if ((err as NodeJS.ErrnoException).code === "ENOENT" && existsSync(logPath)) {
            runTail();
          } else if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            console.error("journalctl not found. Run core as systemd service or redirect output to a log file.");
            process.exit(1);
          } else {
            console.error("Failed to run journalctl:", err.message);
            process.exit(1);
          }
        });
        proc.on("exit", (code) => process.exit(code ?? 0));
      }
    });
  return cmd;
}
