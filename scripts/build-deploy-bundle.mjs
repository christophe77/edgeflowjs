#!/usr/bin/env node
/**
 * Build platform-agnostic deployment bundle for EdgeFlow.
 * Produces deploy-bundle/ with runtime, kiosk app, and templates.
 * Run after: pnpm build
 */
import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "deploy-bundle");

const CORE_DIST = join(ROOT, "packages", "core", "dist");
const KIOSK_DIST = join(ROOT, "apps", "example-kiosk", "dist");
const SERVE_SCRIPT = join(ROOT, "scripts", "serve-kiosk.js");

if (!existsSync(CORE_DIST) || !existsSync(join(CORE_DIST, "run.js"))) {
  console.error("Error: packages/core/dist/run.js not found. Run 'pnpm build' first.");
  process.exit(1);
}

if (!existsSync(KIOSK_DIST) || !existsSync(join(KIOSK_DIST, "index.html"))) {
  console.error("Error: apps/example-kiosk/dist not found. Run 'pnpm build' first.");
  process.exit(1);
}

console.log("Building deploy bundle...");

// Clean and create structure
mkdirSync(join(OUT, "runtime"), { recursive: true });
mkdirSync(join(OUT, "apps", "kiosk-app"), { recursive: true });
mkdirSync(join(OUT, "templates", "systemd"), { recursive: true });
mkdirSync(join(OUT, "templates", "kiosk"), { recursive: true });

// Copy core runtime
cpSync(CORE_DIST, join(OUT, "runtime"), { recursive: true });

// Install runtime deps (better-sqlite3, ws)
const runtimePkg = {
  name: "edgeflow-runtime",
  private: true,
  type: "module",
  dependencies: { "better-sqlite3": "^11.6.0", "ws": "^8.18.0" },
};
writeFileSync(join(OUT, "runtime", "package.json"), JSON.stringify(runtimePkg, null, 2));
const npm = spawnSync("npm", ["install", "--omit=dev"], {
  cwd: join(OUT, "runtime"),
  stdio: "inherit",
});
if (npm.status !== 0) {
  console.error("npm install failed in runtime");
  process.exit(1);
}

// Copy kiosk app
cpSync(KIOSK_DIST, join(OUT, "apps", "kiosk-app"), { recursive: true });

// Copy serve-kiosk.js
cpSync(SERVE_SCRIPT, join(OUT, "serve-kiosk.js"));

// start.sh
writeFileSync(
  join(OUT, "start.sh"),
  `#!/bin/bash
# EdgeFlow runtime launcher (platform-agnostic)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export EDGEFLOW_ROOT="$SCRIPT_DIR"
export DATA_DIR="$SCRIPT_DIR/data"

cd "$SCRIPT_DIR"
exec node runtime/run.js
`,
  { mode: 0o755 }
);

// templates/systemd/edgeflow.service
writeFileSync(
  join(OUT, "templates", "systemd", "edgeflow.service"),
  `[Unit]
Description=EdgeFlow Runtime
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/edgeflow
ExecStart=/usr/bin/node /opt/edgeflow/runtime/run.js
Restart=always
RestartSec=5
User=pi
Environment=NODE_ENV=production
Environment=EDGEFLOW_ROOT=/opt/edgeflow
Environment=DATA_DIR=/opt/edgeflow/data

[Install]
WantedBy=multi-user.target
`
);

// templates/kiosk/kiosk.sh
writeFileSync(
  join(OUT, "templates", "kiosk", "kiosk.sh"),
  `#!/bin/bash
# EdgeFlow Kiosk - Chromium fullscreen
# Start serve-kiosk.js first (or run as separate service), then launch Chromium.

export DISPLAY=:0
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

chromium-browser \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --no-first-run \\
  --disable-session-crashed-bubble \\
  --incognito \\
  "http://localhost:3000"
`,
  { mode: 0o755 }
);

// templates/systemd/edgeflow-kiosk.service (optional: serves kiosk app)
writeFileSync(
  join(OUT, "templates", "systemd", "edgeflow-kiosk-server.service"),
  `[Unit]
Description=EdgeFlow Kiosk Static Server
After=network.target edgeflow.service

[Service]
Type=simple
WorkingDirectory=/opt/edgeflow
ExecStart=/usr/bin/node /opt/edgeflow/serve-kiosk.js 3000
Restart=always
RestartSec=5
User=pi
Environment=EDGEFLOW_ROOT=/opt/edgeflow

[Install]
WantedBy=multi-user.target
`
);

console.log(`Deploy bundle written to ${OUT}`);
console.log("Contents: runtime/, apps/kiosk-app/, serve-kiosk.js, start.sh, templates/");
