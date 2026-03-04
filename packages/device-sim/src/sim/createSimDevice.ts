import type { DeviceAdapter, GpioPort, SerialPort, NetworkPort, NetworkStatus, SystemPort, IdentityPort } from "@edgeflowjs/device";
import { simBusEmit, simBusSubscribe } from "./simBus.js";

const gpioState = new Map<number, boolean>();
const serialHandlers = new Map<string, (data: Uint8Array) => void>();
let networkOnline = true;
const networkHandlers: ((s: NetworkStatus) => void)[] = [];

const gpio: GpioPort = {
  async open(pin, _dir) {
    if (!gpioState.has(pin)) gpioState.set(pin, false);
  },
  async read(pin) {
    return gpioState.get(pin) ?? false;
  },
  async write(pin, value) {
    gpioState.set(pin, value);
    simBusEmit({ type: "device.gpio.edge", pin, value });
  },
  async watch(_pin, _edge, _handler) {
    return () => {};
  },
  async close(_pin) {},
};

const serial: SerialPort = {
  async open(_path, _cfg) {},
  async send(_path, _data) {},
  async onData(path, handler) {
    serialHandlers.set(path, handler);
    return () => {
      serialHandlers.delete(path);
    };
  },
  async close(_path) {},
};

const network: NetworkPort = {
  async status() {
    return { online: networkOnline, kind: "ethernet" };
  },
  async onChange(handler) {
    networkHandlers.push(handler);
    return () => {
      const i = networkHandlers.indexOf(handler);
      if (i >= 0) networkHandlers.splice(i, 1);
    };
  },
};

const system: SystemPort = {
  async reboot() {
    console.log("[sim] reboot requested");
  },
  async shutdown() {
    console.log("[sim] shutdown requested");
  },
  async uptimeMs() {
    return process.uptime() * 1000;
  },
  async serviceStatus(_name) {
    return "active";
  },
};

const identity: IdentityPort = {
  async deviceId() {
    return "sim-device-001";
  },
  async hwRevision() {
    return "sim-1.0";
  },
};

export type SimDevice = DeviceAdapter & {
  setNetworkOnline(online: boolean): void;
  injectSerial(port: string, data: string): void;
  setGpio(pin: number, value: boolean): Promise<void>;
  getGpio(pin: number): boolean;
};

export function createSimDevice(): SimDevice {
  return {
    gpio,
    serial,
    network,
    system,
    identity,

    setNetworkOnline(online: boolean) {
      if (networkOnline === online) return;
      networkOnline = online;
      simBusEmit({ type: "device.network.changed", online, kind: "ethernet" });
      const status: NetworkStatus = { online, kind: "ethernet" };
      for (const h of networkHandlers) h(status);
    },

    injectSerial(port: string, data: string) {
      const handler = serialHandlers.get(port);
      const bytes = new TextEncoder().encode(data);
      if (handler) handler(bytes);
      simBusEmit({ type: "device.serial.received", port, data });
    },

    async setGpio(pin: number, value: boolean) {
      gpioState.set(pin, value);
      await gpio.write(pin, value);
    },

    getGpio(pin: number) {
      return gpioState.get(pin) ?? false;
    },
  };
}

export { simBusSubscribe };
