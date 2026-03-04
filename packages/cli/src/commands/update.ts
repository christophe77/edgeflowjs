import { Command } from "commander";

export function updateCommand(): Command {
  const cmd = new Command("update")
    .description("Check and apply OTA update (stub)")
    .action(() => {
      console.log("edgeflow update — stub. Future: ota.check + ota.apply.");
    });
  return cmd;
}
