# @edgeflowjs/device-rpi

Raspberry Pi device adapter for EdgeFlow. Implements GPIO, Serial, Network, System, and Identity ports for real hardware.

## Install

```bash
pnpm add @edgeflowjs/device-rpi
```

On Raspberry Pi, install optional peer dependencies for GPIO and Serial:

```bash
pnpm add onoff serialport
```

## Usage

```ts
import { createRpiDevice, detectPi } from "@edgeflowjs/device-rpi";

if (detectPi()) {
  const device = await createRpiDevice();
  // Use device.gpio, device.serial, etc.
}
```

## Ports

- **GPIO** — via `onoff` (optional)
- **Serial** — via `serialport` (optional)
- **Network** — Node.js `os.networkInterfaces()`
- **System** — `reboot`, `shutdown` via `child_process`
- **Identity** — `/etc/machine-id`, `/proc/device-tree/model`

## Permissions

On Raspberry Pi, add your user to the `gpio` group for GPIO access:

```bash
sudo usermod -aG gpio $USER
```
