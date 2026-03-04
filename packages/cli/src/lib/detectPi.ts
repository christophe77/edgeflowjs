import { readFileSync, existsSync } from "node:fs";

/** Detect if running on Raspberry Pi. Checks /proc/device-tree/model on Linux. */
export function detectPi(): boolean {
  try {
    if (!existsSync("/proc/device-tree/model")) return false;
    const model = readFileSync("/proc/device-tree/model", "utf-8");
    return model.toLowerCase().includes("raspberry pi");
  } catch {
    return false;
  }
}
