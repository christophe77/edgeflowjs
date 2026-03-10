#!/usr/bin/env node

import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// When built, we're in dist/index.js; template is at ../template
const PKG_ROOT = join(__dirname, "..");
const TEMPLATE_DIR = join(PKG_ROOT, "template");

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.log("Usage: npx @edgeflowjs/create-edgeflow <project-name>");
    console.log("   or: npx @edgeflowjs/create-edgeflow .");
    console.log("");
    console.log("Examples:");
    console.log("  npx @edgeflowjs/create-edgeflow my-kiosk");
    console.log("  npx @edgeflowjs/create-edgeflow .");
    process.exit(1);
  }

  const targetDir = arg === "." ? process.cwd() : join(process.cwd(), arg);

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    console.error(`Error: Directory ${targetDir} already exists and is not empty.`);
    process.exit(1);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    console.error("Error: Template not found. Reinstall create-edgeflow.");
    process.exit(1);
  }

  console.log(`Creating EdgeFlow kiosk project in ${targetDir}...`);

  mkdirSync(targetDir, { recursive: true });
  cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

  if (arg !== ".") {
    const pkgPath = join(targetDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg.name = arg;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  // Use shell so pnpm is found when run via npx (PATH may differ)
  const hasPnpm = spawnSync("pnpm", ["--version"], { stdio: "pipe", shell: true }).status === 0;
  const installCmd = hasPnpm ? "pnpm" : "npm";
  const installArgs = hasPnpm ? ["install"] : ["install"];

  console.log(`Running ${installCmd} install...`);
  const install = spawnSync(installCmd, installArgs, { cwd: targetDir, stdio: "inherit", shell: true });
  if (install.status !== 0) {
    console.error("Install failed.");
    console.error(`Try running manually: ${arg !== "." ? `cd ${arg} && ` : ""}${installCmd} install`);
    process.exit(1);
  }

  console.log("");
  console.log("Done! Your EdgeFlow kiosk is ready.");
  console.log("");
  console.log("Next steps:");
  if (arg !== ".") {
    console.log(`  cd ${arg}`);
  }
  console.log("  pnpm exec edgeflow dev   # Start core + kiosk app");
  console.log("  # Or: pnpm run dev       # Kiosk only (core must run separately)");
  console.log("");
  console.log("Deploy to Raspberry Pi:");
  console.log("  pnpm exec edgeflow build");
  console.log("  pnpm exec edgeflow deploy --host <raspberry-ip>");
  console.log("");
}

main();
