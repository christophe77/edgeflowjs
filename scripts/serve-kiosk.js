#!/usr/bin/env node
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
    res.end(String(err.message));
  }
});

server.listen(PORT, () => {
  console.log(`Kiosk server at http://localhost:${PORT}`);
});
