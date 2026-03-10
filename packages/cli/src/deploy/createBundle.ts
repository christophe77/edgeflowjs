/**
 * Create deploy bundle for EdgeFlow.
 * Works for both monorepo and standalone projects.
 */
import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SERVE_KIOSK_JS = `#!/usr/bin/env node
/**
 * Minimal static file server for EdgeFlow kiosk app.
 * Serves from EDGEFLOW_ROOT/apps/kiosk-app or ./apps/kiosk-app relative to cwd.
 * Usage: node serve-kiosk.js [port]
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { existsSync } from "node:fs";

const PORT = Number(process.env.KIOSK_PORT || process.argv[2] || 3000);
const ROOT = process.env.EDGEFLOW_ROOT || process.cwd();
const APP_DIR = join(ROOT, "apps", "kiosk-app");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  let path = req.url === "/" ? "/index.html" : req.url;
  path = path.split("?")[0];
  if (path.includes("..")) {
    res.writeHead(403);
    res.end();
    return;
  }
  const filePath = join(APP_DIR, path);
  if (!filePath.startsWith(APP_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  try {
    const data = await readFile(filePath);
    const mime = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err instanceof Error ? err.message : err));
  }
});

server.listen(PORT, () => {
  console.log("Kiosk server at http://localhost:" + PORT);
});
`;

const EDGEFLOW_SERVICE = `[Unit]
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
`;

const KIOSK_SH = `#!/bin/bash
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
`;

const KIOSK_SERVER_SERVICE = `[Unit]
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
`;

export function createBundle(opts: {
  root: string;
  runtimePath: string;
  kioskDistPath: string;
  outDir?: string;
}): string {
  const { root, runtimePath, kioskDistPath, outDir = join(root, "deploy-bundle") } = opts;

  if (!existsSync(runtimePath) || !existsSync(join(runtimePath, "run.js"))) {
    throw new Error(`Runtime not found at ${runtimePath}. Run build first.`);
  }

  if (!existsSync(kioskDistPath) || !existsSync(join(kioskDistPath, "index.html"))) {
    throw new Error(`Kiosk app dist not found at ${kioskDistPath}. Run build first.`);
  }

  mkdirSync(join(outDir, "runtime"), { recursive: true });
  mkdirSync(join(outDir, "apps", "kiosk-app"), { recursive: true });
  mkdirSync(join(outDir, "templates", "systemd"), { recursive: true });
  mkdirSync(join(outDir, "templates", "kiosk"), { recursive: true });

  cpSync(runtimePath, join(outDir, "runtime"), { recursive: true });

  const runtimePkg = {
    name: "edgeflow-runtime",
    private: true,
    type: "module",
    dependencies: { "better-sqlite3": "^11.6.0", ws: "^8.18.0" },
  };
  writeFileSync(join(outDir, "runtime", "package.json"), JSON.stringify(runtimePkg, null, 2));

  const npm = spawnSync("npm", ["install", "--omit=dev"], {
    cwd: join(outDir, "runtime"),
    stdio: "inherit",
  });
  if (npm.status !== 0) {
    throw new Error("npm install failed in runtime");
  }

  cpSync(kioskDistPath, join(outDir, "apps", "kiosk-app"), { recursive: true });

  writeFileSync(join(outDir, "serve-kiosk.js"), SERVE_KIOSK_JS);

  writeFileSync(
    join(outDir, "start.sh"),
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

  writeFileSync(join(outDir, "templates", "systemd", "edgeflow.service"), EDGEFLOW_SERVICE);
  writeFileSync(join(outDir, "templates", "kiosk", "kiosk.sh"), KIOSK_SH, { mode: 0o755 });
  writeFileSync(join(outDir, "templates", "systemd", "edgeflow-kiosk-server.service"), KIOSK_SERVER_SERVICE);

  return outDir;
}
