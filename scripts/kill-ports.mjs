#!/usr/bin/env node
/**
 * Kill processes using EdgeFlow dev ports (bridge + vite).
 * Usage: node scripts/kill-ports.mjs
 */
import { execSync, spawnSync } from "child_process";
import { platform } from "os";

const PORTS = [19707, 19708, 5173, 5174];

function getPidsWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
    const pids = new Set();
    for (const line of out.split("\n")) {
      const m = line.trim().match(/\s+(\d+)\s*$/);
      if (m) pids.add(m[1]);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function getPidsUnix(port) {
  try {
    const out = execSync(`lsof -ti :${port} 2>/dev/null || true`, { encoding: "utf-8" });
    return out.trim() ? out.trim().split(/\s+/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function killPid(pid) {
  const isWin = platform() === "win32";
  const cmd = isWin ? "taskkill" : "kill";
  const args = isWin ? ["/PID", pid, "/F"] : ["-9", pid];
  spawnSync(cmd, args, { stdio: "inherit" });
}

const isWin = platform() === "win32";
const getPids = isWin ? getPidsWindows : getPidsUnix;

const allPids = new Set();
for (const port of PORTS) {
  const pids = getPids(port);
  for (const pid of pids) {
    if (pid && pid !== "0") allPids.add(pid);
  }
}

if (allPids.size === 0) {
  console.log("No processes found on ports", PORTS.join(", "));
  process.exit(0);
}

console.log("Killing processes on ports", PORTS.join(", "), ":", [...allPids].join(", "));
for (const pid of allPids) {
  killPid(pid);
}
console.log("Done.");
