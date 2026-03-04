import { join } from "node:path";
import { createInterface } from "node:readline";
import { Command } from "commander";
import { createOtaService } from "@edgeflowjs/ota";
import { getProjectRoot } from "../lib/config.js";

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export function updateCommand(): Command {
  const cmd = new Command("update")
    .description("Check and apply OTA update")
    .option("-y, --yes", "Apply update without prompting")
    .action(async (opts) => {
      const root = getProjectRoot();
      const appPath = join(root, "packages", "core");
      const ota = createOtaService({
        manifestUrl: process.env.OTA_MANIFEST_URL,
        appPath,
      });

      console.log("Checking for updates…");
      const { available, manifest } = await ota.check();

      if (!available || !manifest) {
        console.log("No update available.");
        return;
      }

      console.log(`Update available: ${manifest.version}`);
      if (!opts.yes) {
        const answer = await prompt("Apply update? (y/n) ");
        if (answer !== "y" && answer !== "yes") {
          console.log("Cancelled.");
          return;
        }
      }

      try {
        const unsub = ota.onStatus((s) => {
          if (s.state === "downloading") {
            process.stdout.write(`\rDownloading… ${Math.round((s.progress ?? 0) * 100)}%`);
          } else if (s.state !== "idle") {
            console.log(`\n${s.state}…`);
          }
        });
        await ota.apply(manifest.version);
        unsub();
        console.log(`Update ${manifest.version} staged. Restart the core to complete.`);
      } catch (err) {
        console.error("Update failed:", (err as Error).message);
        process.exit(1);
      }
    });
  return cmd;
}
