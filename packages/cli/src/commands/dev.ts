import { Command } from "commander";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function devCommand(): Command {
  const cmd = new Command("dev")
    .description("Launch core + app (concurrently)")
    .action(async () => {
      const root = path.resolve(__dirname, "../../..");
      const child = spawn("pnpm", ["run", "dev"], {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      child.on("exit", (code) => process.exit(code ?? 0));
    });
  return cmd;
}
