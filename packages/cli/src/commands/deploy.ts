import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { Command } from "commander";
import { getProjectRoot } from "../lib/config.js";
import { detectPi } from "../lib/detectPi.js";

export function deployCommand(): Command {
  const cmd = new Command("deploy").description("Deploy to device (systemd, kiosk)");

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
