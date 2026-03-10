# Deployment

This guide covers building and deploying EdgeFlow for production.

## Project types

EdgeFlow supports two workflows:

- **Monorepo:** Clone the repo, develop with all packages. Build outputs in `apps/example-kiosk/dist/`.
- **Standalone:** Create with `npx create-edgeflow my-kiosk`. Build outputs in `dist/`. Update via `pnpm update @edgeflowjs/*`.

The CLI detects the project type and uses the correct paths for build and deploy.

## Production Build

```bash
pnpm build
# or: edgeflow build
```

This builds:
- **Monorepo:** All packages (flow, bridge, sync, etc.), `apps/example-kiosk`, `apps/devtools`
- **Standalone:** The kiosk app only (output in `dist/`)

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

## Sync Sink (Outbox)

To push outbox events to a backend, set `SYNC_SINK_URL` in `.env`:

```
SYNC_SINK_URL=https://your-api.com/events
```

The sync engine POSTs each pending event as JSON:

```json
{
  "type": "EventType",
  "payload": { ... },
  "idempotencyKey": "uuid"
}
```

Your endpoint should return 2xx on success. On failure (4xx, 5xx, or network error), the engine retries with exponential backoff.

## Core as a Service

Run the core as a long-running process:

```bash
node packages/core/dist/run.js
```

For production, use a process manager:
- **systemd** — create a unit file
- **pm2** — `pm2 start packages/core/dist/run.js --name edgeflow-core`

Ensure the core has write access to `packages/core/data/` for SQLite and crash reports.

**SQLite on Windows:** If `better-sqlite3` fails to load, set `SYNC_STORE=memory` in `.env` to use the in-memory store. For SQLite, try `npm rebuild better-sqlite3` or run under WSL.

## Remote Deployment to Raspberry Pi

From your developer machine, deploy to a Raspberry Pi over SSH. Works for both monorepo and standalone projects:

```bash
# Build and deploy in one command
edgeflow build
edgeflow deploy --host 192.168.1.50 --user pi
```

Or with pnpm exec (standalone):

```bash
pnpm exec edgeflow build
pnpm exec edgeflow deploy --host 192.168.1.50 --user pi
```

This will:
1. Build the application
2. Create a deploy bundle (runtime + kiosk app)
3. Copy files to `/opt/edgeflow/` on the target via SCP
4. Install and start the systemd service

**Options:**
- `--host <ip>` — Target device IP or hostname (required for remote)
- `--user <user>` — SSH user (default: `pi`)
- `--platform <name>` — `raspberry-pi` (default) or `linux`
- `--key <path>` — SSH key path

**Prerequisites on the Pi:**
- SSH access (password or key)
- Node.js 18+ installed
- `sudo` without password for the deploy user, or deploy as root

## Runtime Layout on Device

After deployment, the application is installed at:

```
/opt/edgeflow/
  runtime/           # Core (run.js, node_modules)
  apps/kiosk-app/    # Static kiosk UI
  data/              # SQLite, crash reports (persistent)
  logs/              # Log files
  serve-kiosk.js     # Static server for kiosk
  start.sh           # Runtime launcher
  templates/         # systemd, kiosk scripts
```

The core runs via systemd. To serve the kiosk UI, run `node serve-kiosk.js 3000` (or install `edgeflow-kiosk-server.service`). Then launch Chromium in kiosk mode pointing to `http://localhost:3000`.

## Raspberry Pi (Manual Setup)

1. **Install Node 18+** and pnpm on Raspberry Pi OS.
2. **Clone and build** the repo on the device or use remote deploy.
3. **Run core** as a systemd service.
4. **Serve kiosk** — use `serve-kiosk.js` from the deploy bundle or `npx serve`.
5. **Chromium kiosk mode** — launch Chromium with flags to run fullscreen, hide cursor, disable screen blanking.

## Raspberry Pi Device Adapter

When running on Raspberry Pi (detected via `/proc/device-tree/model`), EdgeFlow uses `@edgeflowjs/device-rpi` for real GPIO and Serial. Install optional dependencies:

```bash
pnpm add onoff serialport
```

Add your user to the `gpio` group for GPIO access:

```bash
sudo usermod -aG gpio $USER
```

Use the CLI to generate deployment artifacts:

```bash
# Generate systemd unit file
edgeflow deploy systemd -o edgeflow.service
sudo cp edgeflow.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable edgeflow
sudo systemctl start edgeflow

# Generate Chromium kiosk launch script
edgeflow deploy kiosk -o kiosk.sh -u http://localhost:3000
chmod +x kiosk.sh
./kiosk.sh
```

## CLI Utilities

```bash
# Create a new project (standalone)
edgeflow init my-kiosk
# or: npx create-edgeflow my-kiosk

# Restart the runtime (local or remote)
edgeflow restart
edgeflow restart --host 192.168.1.50

# View logs
edgeflow logs
edgeflow logs --host 192.168.1.50 --user pi

# Check environment
edgeflow doctor
edgeflow doctor --host 192.168.1.50
```

See [docs/ARCHITECTURE.md](../ARCHITECTURE.md) section 10 for OS integration notes.

## DevTools in Production

The devtools app (`apps/devtools`) is for development. Do not expose it publicly in production — it shows internal state and crash reports.
