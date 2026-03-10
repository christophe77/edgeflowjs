import { Command } from "commander";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initCommand(): Command {
  return new Command("init")
    .description("Create a new EdgeFlow kiosk project (alias for npx @edgeflowjs/create-edgeflow)")
    .argument("[name]", "Project name or . for current directory")
    .action((name?: string) => {
      const args = name ? [name] : [];
      // Monorepo: packages/cli/dist -> packages/create-edgeflow/dist/index.js
      // Installed: node_modules/@edgeflowjs/cli/dist -> node_modules/create-edgeflow (if dep)
      // Monorepo: packages/cli/dist -> packages/create-edgeflow/dist/index.js
      const createEdgeflowPath = join(__dirname, "..", "..", "create-edgeflow", "dist", "index.js");
      let result: ReturnType<typeof spawnSync>;

      if (existsSync(createEdgeflowPath)) {
        result = spawnSync("node", [createEdgeflowPath, ...args], {
          stdio: "inherit",
          shell: process.platform === "win32",
        });
      } else {
        result = spawnSync("npx", ["@edgeflowjs/create-edgeflow", ...args], {
          stdio: "inherit",
          shell: process.platform === "win32",
        });
      }

      process.exit(result.status ?? 0);
    });
}
