import fs from "fs";

/**
 * Detect if running on Raspberry Pi (stub for future implementation).
 * Checks /proc/device-tree/model on Linux.
 */
export function detectPi(): boolean {
  try {
    const model = fs.readFileSync("/proc/device-tree/model", "utf-8");
    return model.toLowerCase().includes("raspberry pi");
  } catch {
    return false;
  }
}
