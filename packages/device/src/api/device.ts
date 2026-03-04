import type { GpioPort } from "../ports/gpio.js";
import type { SerialPort } from "../ports/serial.js";
import type { NetworkPort } from "../ports/network.js";
import type { SystemPort } from "../ports/system.js";
import type { IdentityPort } from "../ports/identity.js";

export type DeviceApi = {
  gpio: GpioPort;
  serial: SerialPort;
  network: NetworkPort;
  system: SystemPort;
  identity: IdentityPort;
};

export type DeviceAdapter = DeviceApi;
