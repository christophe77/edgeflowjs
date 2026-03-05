import { spawnSync } from "node:child_process";
import { Command } from "commander";
import { detectPi } from "../lib/detectPi.js";

function sshExec(host: string, user: string, key: string | undefined, cmd: string): boolean {
  const args = ["-o", "StrictHostKeyChecking=no"];
  if (key) args.push("-i", key);
  args.push(`${user}@${host}`, cmd);
  const r = spawnSync("ssh", args, { stdio: "inherit" });
  return r.status === 0;
}

export function restartCommand(): Command {
  const cmd = new Command("restart")
    .description("Restart EdgeFlow runtime (local or remote)")
    .option("-h, --host <ip>", "Restart on remote host")
    .option("-u, --user <user>", "SSH user (when using --host)", "pi")
    .option("-k, --key <path>", "SSH key path")
    .action((opts) => {
      const host = opts.host;
      if (host) {
        if (!sshExec(host, opts.user, opts.key, "sudo systemctl restart edgeflow")) {
          console.error("Failed to restart");
          process.exit(1);
        }
        console.log("EdgeFlow restarted on " + host);
      } else {
        if (!detectPi()) {
          console.warn("Not on Raspberry Pi. Run with --host <ip> to restart remotely.");
        }
        const r = spawnSync("systemctl", ["restart", "edgeflow"], { stdio: "inherit" });
        if (r.status !== 0) {
          console.error("Failed to restart (is edgeflow.service installed?)");
          process.exit(1);
        }
        console.log("EdgeFlow restarted");
      }
    });
  return cmd;
}
