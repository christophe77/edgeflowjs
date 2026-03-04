import { Command } from "commander";

export function deployCommand(): Command {
  const cmd = new Command("deploy")
    .description("Deploy to device (stub: flash, systemd, kiosk mode)")
    .action(() => {
      console.log("edgeflow deploy — stub. Future: flash image, systemd, kiosk Chromium.");
    });
  return cmd;
}
