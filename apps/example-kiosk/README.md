# example-kiosk

Reference app demonstrating the full EdgeFlow stack: flow engine, bridge, device simulator, maintenance.

## Run

From repo root:

```bash
pnpm dev:app    # Kiosk only (requires core running separately)
pnpm dev        # Core + kiosk together
```

The app opens at `http://localhost:5173`.

## Screens

| Screen | Flow state | Actions |
|--------|------------|---------|
| Idle | `idle` | Start |
| Scan | `scan` | Simulate QR, Cancel |
| Action | `action` | Complete |
| ThankYou | `thankYou` | Auto-reset after 5s |
| Maintenance | — | Token unlock, Inject serial, etc. |

## Flow

The purchase flow: `idle` → `scan` → `action` → `thankYou` → (timeout) → `idle`.

Events are dispatched via the bridge (`flow.dispatch`). The UI subscribes to `flow.transition` to update the screen.

## Configuration

Set `VITE_BRIDGE_URL` in `.env` at repo root (default: `ws://localhost:19707`). The core must be running and reachable at that URL.
