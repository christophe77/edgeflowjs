# @edgeflowjs/cli

EdgeFlow CLI: dev, build, simulate, deploy, logs, update, doctor, kill-ports.

## Usage

From repo root after build:

```bash
pnpm run cli -- dev
pnpm run cli -- build
pnpm run cli -- simulate
pnpm run cli -- doctor
pnpm run cli -- kill-ports
```

Or: `pnpm exec edgeflow dev` (if bin is configured).

## Commands

| Command | Description |
|---------|-------------|
| `dev` | Run core + example-kiosk (concurrently) |
| `build` | Build all packages |
| `simulate` | Run with device-sim |
| `deploy` | Stub (flash, systemd) |
| `logs` | Stub (tail logs) |
| `update` | Stub (ota.check + apply) |
| `doctor` | Validate permissions, ports, config |
| `kill-ports` | Free bridge and Vite ports |
