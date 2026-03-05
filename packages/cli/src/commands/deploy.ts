import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { platform } from "node:os";
import { Command } from "commander";
import { getProjectRoot } from "../lib/config.js";
import { detectPi } from "../lib/detectPi.js";

function run(cmd: string, args: string[], opts?: { cwd?: string }): boolean {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: opts?.cwd });
  return r.status === 0;
}

function sshExec(host: string, user: string, key: string | undefined, cmd: string): boolean {
  const args = ["-o", "StrictHostKeyChecking=no"];
  if (key) args.push("-i", key);
  args.push(`${user}@${host}`, cmd);
  return run("ssh", args);
}

function scpToHost(host: string, user: string, key: string | undefined, localPath: string, remotePath: string): boolean {
  const args = ["-o", "StrictHostKeyChecking=no", "-r"];
  if (key) args.push("-i", key);
  args.push(localPath, `${user}@${host}:${remotePath}`);
  return run("scp", args);
}

export function deployCommand(): Command {
  const cmd = new Command("deploy")
    .description("Deploy to device (systemd, kiosk, or remote via --host)")
    .option("-h, --host <ip>", "Deploy to remote host (IP or hostname)")
    .option("-p, --platform <name>", "Target platform", "raspberry-pi")
    .option("-u, --user <user>", "SSH user", "pi")
    .option("-k, --key <path>", "SSH key path")
    .action(async (opts) => {
      const host = opts.host;
      if (host) {
        const root = getProjectRoot();
        const bundleDir = join(root, "deploy-bundle");
        console.log("Building...");
        if (!run("pnpm", ["build"], { cwd: root })) {
          console.error("Build failed");
          process.exit(1);
        }
        console.log("Creating deploy bundle...");
        if (!run("node", ["scripts/build-deploy-bundle.mjs"], { cwd: root })) {
          console.error("Bundle failed");
          process.exit(1);
        }
        if (!existsSync(bundleDir)) {
          console.error("deploy-bundle not found");
          process.exit(1);
        }
        const user = opts.user;
        const key = opts.key;
        console.log(`Deploying to ${user}@${host}...`);
        if (!sshExec(host, user, key, "sudo mkdir -p /opt/edgeflow/data /opt/edgeflow/logs /tmp/edgeflow-deploy")) {
          console.error("Failed to create remote directories");
          process.exit(1);
        }
        if (!scpToHost(host, user, key, join(bundleDir, "runtime"), "/tmp/edgeflow-deploy/runtime")) {
          process.exit(1);
        }
        if (!scpToHost(host, user, key, join(bundleDir, "apps"), "/tmp/edgeflow-deploy/apps")) {
          process.exit(1);
        }
        if (!scpToHost(host, user, key, join(bundleDir, "serve-kiosk.js"), "/tmp/edgeflow-deploy/")) {
          process.exit(1);
        }
        if (!scpToHost(host, user, key, join(bundleDir, "start.sh"), "/tmp/edgeflow-deploy/")) {
          process.exit(1);
        }
        if (!scpToHost(host, user, key, join(bundleDir, "templates"), "/tmp/edgeflow-deploy/")) {
          process.exit(1);
        }
        const serviceUser = opts.platform === "raspberry-pi" ? "pi" : "root";
        const setup = `sudo cp -r /tmp/edgeflow-deploy/runtime /tmp/edgeflow-deploy/apps /tmp/edgeflow-deploy/templates /opt/edgeflow/ && \
sudo cp /tmp/edgeflow-deploy/serve-kiosk.js /tmp/edgeflow-deploy/start.sh /opt/edgeflow/ && \
sudo chmod +x /opt/edgeflow/start.sh && \
sudo cp /opt/edgeflow/templates/systemd/edgeflow.service /etc/systemd/system/ && \
sudo sed -i 's/User=pi/User=${serviceUser}/' /etc/systemd/system/edgeflow.service && \
sudo systemctl daemon-reload && \
(sudo systemctl is-active --quiet edgeflow && sudo systemctl restart edgeflow || sudo systemctl enable edgeflow && sudo systemctl start edgeflow)`;
        if (!sshExec(host, user, key, setup)) {
          console.error("Failed to install and start service");
          process.exit(1);
        }
        console.log("Deployed. Core running at ws://" + host + ":19707");
      } else {
        console.log("Use: edgeflow deploy --host <ip> | edgeflow deploy systemd | edgeflow deploy kiosk");
      }
    });

  cmd
    .command("systemd")
    .description("Generate systemd unit file for EdgeFlow core")
    .option("-o, --output <path>", "Output path for unit file", "edgeflow.service")
    .action((opts) => {
      if (!detectPi()) {
        console.warn("Warning: Not running on Raspberry Pi. Unit file may need path adjustments.");
      }
      const root = getProjectRoot();
      const corePath = join(root, "packages", "core", "dist", "run.js");
      const dataDir = join(root, "packages", "core", "data");
      const unit = `[Unit]
Description=EdgeFlow Core
After=network.target

[Service]
Type=simple
WorkingDirectory=${join(root, "packages", "core")}
ExecStart=/usr/bin/node ${corePath}
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATA_DIR=${dataDir}

[Install]
WantedBy=multi-user.target
`;
      const outPath = join(root, opts.output);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, unit);
      console.log(`Wrote ${outPath}`);
      console.log("");
      console.log("To install:");
      console.log("  sudo cp edgeflow.service /etc/systemd/system/");
      console.log("  sudo systemctl daemon-reload");
      console.log("  sudo systemctl enable edgeflow");
      console.log("  sudo systemctl start edgeflow");
    });

  cmd
    .command("kiosk")
    .description("Generate Chromium kiosk launch script")
    .option("-o, --output <path>", "Output path for script", "kiosk.sh")
    .option("-u, --url <url>", "Kiosk URL", "http://localhost:3000")
    .action((opts) => {
      const root = getProjectRoot();
      const script = `#!/bin/bash
# EdgeFlow Kiosk - Chromium fullscreen
# URL: ${opts.url}

export DISPLAY=:0
xset s off
xset -dpms
xset s noblank

chromium-browser \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --no-first-run \\
  --disable-session-crashed-bubble \\
  --incognito \\
  "${opts.url}"
`;
      const outPath = join(root, opts.output);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, script);
      console.log(`Wrote ${outPath}`);
      console.log("");
      console.log("To run:");
      console.log("  chmod +x kiosk.sh");
      console.log("  ./kiosk.sh");
      console.log("");
      console.log("Ensure the kiosk app is served at the URL (e.g. npx serve -l 3000 apps/example-kiosk/dist)");
    });

  return cmd;
}
