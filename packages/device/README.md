# @edgeflow/device

Hardware abstraction layer: GPIO, Serial, Network, System, Identity ports.

## Install

```bash
pnpm add @edgeflow/device
```

## Exports

Types only (interfaces). Implementations come from adapters:

- `DeviceApi`, `DeviceAdapter`
- `GpioPort`, `SerialPort`, `NetworkPort`, `SystemPort`, `IdentityPort`
- `DeviceEvent`

## Usage

Consume the API; provide an adapter (e.g. `@edgeflow/device-sim`):

```ts
import type { DeviceAdapter } from "@edgeflow/device";
import { createSimDevice } from "@edgeflow/device-sim";

const device: DeviceAdapter = createSimDevice();
await device.gpio.read(17);
device.setNetworkOnline(true); // SimDevice extension
```

## Docs

- [API reference](../../docs/api/device.md)
