import path from "node:path";
import { existsSync } from "node:fs";

/**
 * Find project root by walking up from cwd until package.json is found.
 */
export function getProjectRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

/**
 * Check if project is a monorepo (has packages/core or pnpm-workspace.yaml).
 */
export function isMonorepo(root: string): boolean {
  return (
    existsSync(path.join(root, "packages", "core")) ||
    existsSync(path.join(root, "pnpm-workspace.yaml"))
  );
}

/**
 * Get path to runtime (core dist). Monorepo: packages/core/dist; Standalone: node_modules/@edgeflowjs/core/dist.
 */
export function getRuntimePath(root: string): string {
  if (isMonorepo(root)) {
    return path.join(root, "packages", "core", "dist");
  }
  return path.join(root, "node_modules", "@edgeflowjs", "core", "dist");
}

/**
 * Get path to kiosk app build output. Monorepo: apps/example-kiosk/dist; Standalone: dist.
 */
export function getKioskDistPath(root: string): string {
  if (isMonorepo(root)) {
    return path.join(root, "apps", "example-kiosk", "dist");
  }
  return path.join(root, "dist");
}
