# Getting Started

This guide walks you through setting up EdgeFlow and running your first flow.

## Prerequisites

- **Node.js** >= 18
- **pnpm** — install with `npm install -g pnpm` (or use npm)

## Option A: Create a new project (standalone)

Create a new kiosk project without cloning the monorepo:

```bash
npx @edgeflowjs/create-edgeflow my-kiosk
cd my-kiosk
pnpm install
pnpm exec edgeflow dev
```

This scaffolds a complete kiosk app with flow, i18n, and maintenance. Deploy to Raspberry Pi with:

```bash
pnpm exec edgeflow build
pnpm exec edgeflow deploy --host <raspberry-ip>
```

## Option B: Clone and develop (monorepo)

```bash
git clone https://github.com/christophe77/edgeflow.git
cd edgeflow
pnpm install
```

## Build

```bash
pnpm build
```

This builds all packages in the monorepo (flow, bridge, sync, device, core, etc.). For standalone projects, it builds the kiosk app only.

## Configuration

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

Default values:
- `BRIDGE_PORT=19707` — WebSocket server port
- `VITE_BRIDGE_URL=ws://localhost:19707` — Bridge URL for the kiosk app

## Run

Start the core and example kiosk:

```bash
pnpm dev
```

This runs:
- **Core** — Bridge server at `ws://localhost:19707`, flow engine, sync, device simulator
- **Example kiosk** — React app at `http://localhost:5173`

Optional: run the debug dashboard:

```bash
pnpm dev:all
```

This adds **DevTools** at `http://localhost:3001` (flow timeline, outbox inspector, crash reports).

## Verify

1. Open `http://localhost:5173` in your browser.
2. Click **Start** to begin the purchase flow.
3. Click **Simulate QR** to simulate a QR scan.
4. Click **Complete** to finish the action.
5. The flow resets to Idle after a few seconds.

Try **Maintenance**: click the wrench icon, enter any token, unlock, and use **Inject serial** to inject a serial message.

## Troubleshooting

### Port already in use

If you see `EADDRINUSE` or "Port already in use":

```bash
pnpm kill-ports
```

This frees ports 19707, 19708, 5173, 5174. Or change `BRIDGE_PORT` and `VITE_BRIDGE_URL` in `.env` to different ports.

### SQLite unavailable

On some systems (e.g. Windows without native bindings), SQLite may be unavailable. The core falls back to an in-memory sync store and logs:

```
SQLite unavailable, using in-memory sync store
```

This is fine for development. Data is lost on restart.

### Build fails

Ensure Node >= 18 and pnpm is installed:

```bash
node -v   # should be >= 18
pnpm -v
```

Run a clean install:

```bash
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
pnpm build
```
