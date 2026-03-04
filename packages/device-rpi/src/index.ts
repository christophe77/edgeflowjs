import { readFileSync, existsSync } from "node:fs";
import type { DeviceAdapter } from "@edgeflowjs/device";
import { createGpioPort } from "./gpio.js";
import { createSerialPort } from "./serial.js";
import { createNetworkPort } from "./network.js";
import { createSystemPort } from "./system.js";
import { createIdentityPort } from "./identity.js";

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

export async function createRpiDevice(): Promise<DeviceAdapter> {
  const [gpio, serial] = await Promise.all([createGpioPort(), createSerialPort()]);
  return {
    gpio,
    serial,
    network: createNetworkPort(),
    system: createSystemPort(),
    identity: createIdentityPort(),
  };
}
