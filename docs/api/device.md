# Device API

Hardware abstraction layer for GPIO, Serial, Network, System, and Identity. Implementations are provided by adapters (e.g. `@edgeflowjs/device-sim` for development).

## Ports

The `DeviceApi` aggregates these ports:

| Port | Purpose |
|------|---------|
| `gpio` | Read/write GPIO pins, watch edges |
| `serial` | Open serial ports, send/receive data |
| `network` | Network status, online/offline |
| `system` | Reboot, shutdown, uptime, service status |
| `identity` | Device ID, hardware revision |

## DeviceAdapter

```ts
type DeviceAdapter = DeviceApi;
```

An adapter implements all ports. For MVP, the adapter provides the ports directly.

## GpioPort

```ts
type GpioPort = {
  open(pin: number, direction: "in" | "out"): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  watch(pin: number, edge: "rising" | "falling" | "both", handler: (value: boolean) => void): Promise<() => void>;
  close(pin: number): Promise<void>;
};
```

## SerialPort

```ts
type SerialPort = {
  open(path: string, cfg: { baudRate: number }): Promise<void>;
  send(path: string, data: Uint8Array): Promise<void>;
  onData(path: string, handler: (data: Uint8Array) => void): Promise<() => void>;
  close(path: string): Promise<void>;
};
```

## NetworkPort

```ts
type NetworkPort = {
  status(): Promise<{ online: boolean; kind?: string }>;
  onChange(handler: (s: NetworkStatus) => void): Promise<() => void>;
};
```

## SystemPort

```ts
type SystemPort = {
  reboot(): Promise<void>;
  shutdown(): Promise<void>;
  uptimeMs(): Promise<number>;
  serviceStatus(name: string): Promise<"active" | "inactive" | "failed" | "unknown">;
};
```

## IdentityPort

```ts
type IdentityPort = {
  deviceId(): Promise<string>;
  hwRevision(): Promise<string | null>;
};
```

## Device Simulator

For development, use `@edgeflowjs/device-sim`:

```ts
import { createSimDevice } from "@edgeflowjs/device-sim";

const device = createSimDevice();
device.setNetworkOnline(true);
device.injectSerial("/dev/ttyUSB0", "QR:123456");
device.setGpio(17, true);
```

See [packages/device-sim/README.md](../../packages/device-sim/README.md).

## Full Interface Definitions

See [REPO.md](../REPO.md) section 2.4 for complete types and `DeviceEvent`.
