# @edgeflowjs/maintenance

Maintenance mode: unlock, session validation, run actions, audit log.

## Install

```bash
pnpm add @edgeflowjs/maintenance
```

## Exports

- `createMaintenanceAuth` — Token-based unlock (QR, USB, button, remote)
- `createMaintenanceService` — Auth + runAction + listActions
- `auditRecord`, `auditGetRecent` — Audit log
- Types: `MaintenanceSession`, `MaintenanceAuth`, `MaintenanceService`, `MaintenanceActionResult`, `AuditEntry`

## Usage

```ts
import { createMaintenanceAuth, createMaintenanceService } from "@edgeflowjs/maintenance";

const auth = createMaintenanceAuth({ ttlMs: 600_000 });
const service = createMaintenanceService(auth, { device, sync, ota, runActionImpl });

const session = await service.auth.unlock({ method: "qr", token: "..." });
const result = await service.runAction(session.sessionId, "device.injectSerial", { port: "/dev/ttyUSB0", data: "QR:123" });
```
