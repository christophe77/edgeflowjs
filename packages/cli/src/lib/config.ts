import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve project root (monorepo root).
 */
export function getProjectRoot(): string {
  return path.resolve(__dirname, "../../..");
}
