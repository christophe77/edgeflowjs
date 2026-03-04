# Deployment

This guide covers building and deploying EdgeFlow for production.

## Production Build

```bash
pnpm build
```

This builds:
- All packages (flow, bridge, sync, etc.)
- `apps/example-kiosk` — output in `apps/example-kiosk/dist/`
- `apps/devtools` — output in `apps/devtools/dist/`

## Environment Variables

Create `.env.production` at the repo root before building. Vite reads it via `envDir`:

```
VITE_BRIDGE_URL=ws://your-server:19707
```

Replace `your-server` with the hostname or IP where the core runs. The kiosk app is built with this URL baked in.

## Serving the Kiosk

The kiosk is a static SPA. Serve the `apps/example-kiosk/dist/` folder with any static server:

```bash
# Example: serve with Node
npx serve apps/example-kiosk/dist -l 3000

# Or: copy dist/ to your web server (nginx, Apache, etc.)
```

The core must be running separately and reachable at `VITE_BRIDGE_URL`.

## Core as a Service

Run the core as a long-running process:

```bash
node packages/core/dist/run.js
```

For production, use a process manager:
- **systemd** — create a unit file
- **pm2** — `pm2 start packages/core/dist/run.js --name edgeflow-core`

Ensure the core has write access to `packages/core/data/` for SQLite and crash reports.

## Raspberry Pi (High-Level)

1. **Install Node 18+** and pnpm on Raspberry Pi OS.
2. **Clone and build** the repo on the device or cross-compile.
3. **Run core** as a systemd service.
4. **Serve kiosk** — either from the same device (e.g. Express serving static files) or from a separate server.
5. **Chromium kiosk mode** — launch Chromium with flags to run fullscreen, hide cursor, disable screen blanking. Point it to the kiosk URL.

The CLI `edgeflow deploy` is a stub for now; manual setup is required. See [docs/ARCHITECTURE.md](../ARCHITECTURE.md) section 10 for OS integration notes.

## DevTools in Production

The devtools app (`apps/devtools`) is for development. Do not expose it publicly in production — it shows internal state and crash reports.
