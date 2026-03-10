import { Command } from "commander";
import { spawn, spawnSync } from "child_process";
import { getProjectRoot } from "../lib/config.js";

export function buildCommand(): Command {
  const cmd = new Command("build")
    .description("Build project (monorepo or standalone)")
    .action(async () => {
      const root = getProjectRoot();
      const hasPnpm = spawnSync("pnpm", ["--version"], { stdio: "pipe" }).status === 0;
      const buildCmd = hasPnpm ? "pnpm" : "npm";
      const buildArgs = hasPnpm ? ["run", "build"] : ["run", "build"];
      const child = spawn(buildCmd, buildArgs, {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      child.on("exit", (code) => process.exit(code ?? 0));
    });
  return cmd;
}
