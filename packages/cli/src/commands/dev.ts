import { Command } from "commander";
import { spawn, spawnSync } from "child_process";
import { getProjectRoot } from "../lib/config.js";

export function devCommand(): Command {
  const cmd = new Command("dev")
    .description("Launch core + app (concurrently)")
    .action(async () => {
      const root = getProjectRoot();
      const hasPnpm = spawnSync("pnpm", ["--version"], { stdio: "pipe" }).status === 0;
      const runCmd = hasPnpm ? "pnpm" : "npm";
      const runArgs = hasPnpm ? ["run", "dev"] : ["run", "dev"];
      const child = spawn(runCmd, runArgs, {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      child.on("exit", (code) => process.exit(code ?? 0));
    });
  return cmd;
}
