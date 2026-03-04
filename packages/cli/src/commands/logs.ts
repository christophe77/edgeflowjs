import { Command } from "commander";

export function logsCommand(): Command {
  const cmd = new Command("logs")
    .description("Tail logs (stub)")
    .action(() => {
      console.log("edgeflow logs — stub. Future: tail core logs, journalctl.");
    });
  return cmd;
}
