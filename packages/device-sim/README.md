# @edgeflowjs/device-sim

Simulator for development and tests. Implements `DeviceAdapter` with injectable events.

## Install

```bash
pnpm add @edgeflowjs/device-sim
```

## Exports

- `createSimDevice` — Create simulator
- `simBusSubscribe` — Subscribe to device events
- `SimDevice` — Type (DeviceAdapter + simulator methods)

## Usage

```ts
import { createSimDevice, simBusSubscribe } from "@edgeflowjs/device-sim";

const device = createSimDevice();

device.setNetworkOnline(true);
device.injectSerial("/dev/ttyUSB0", "QR:123456");
device.setGpio(17, true);
const value = device.getGpio(17);

simBusSubscribe((evt) => {
  if (evt.type === "device.serial.received") console.log(evt.payload);
});
```

## Docs

- [Device API](../../docs/api/device.md)
