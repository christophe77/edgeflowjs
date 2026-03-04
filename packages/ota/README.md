# @edgeflow/ota

OTA update service (stub). Manifest verification, status events.

## Install

```bash
pnpm add @edgeflow/ota
```

## Exports

- `createOtaService` — Create OTA service
- `verifyManifest` — Verify signed manifest
- Types: `OtaManifest`, `OtaStatus`, `OtaService`

## Usage

```ts
import { createOtaService } from "@edgeflow/ota";

const ota = createOtaService();
ota.onStatus((s) => console.log(s.state));
const result = await ota.check();
await ota.apply("1.0.1");
```
