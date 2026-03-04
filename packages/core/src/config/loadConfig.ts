import type { EdgeflowConfig } from "./schema.js";
import { DEFAULT_CONFIG } from "./schema.js";

export function loadConfig(_configPath?: string): EdgeflowConfig {
  return { ...DEFAULT_CONFIG };
}
