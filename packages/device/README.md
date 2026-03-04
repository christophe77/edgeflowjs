# @edgeflowjs/device

Hardware abstraction layer: GPIO, Serial, Network, System, Identity ports.

## Install

```bash
pnpm add @edgeflowjs/device
```

## Exports

Types only (interfaces). Implementations come from adapters:

- `DeviceApi`, `DeviceAdapter`
- `GpioPort`, `SerialPort`, `NetworkPort`, `SystemPort`, `IdentityPort`
- `DeviceEvent`

## Usage

Consume the API; provide an adapter (e.g. `@edgeflowjs/device-sim`):

```ts
import type { DeviceAdapter } from "@edgeflowjs/device";
import { createSimDevice } from "@edgeflowjs/device-sim";

const device: DeviceAdapter = createSimDevice();
await device.gpio.read(17);
device.setNetworkOnline(true); // SimDevice extension
```

## Docs

- [API reference](../../docs/api/device.md)
