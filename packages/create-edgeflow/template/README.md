# EdgeFlow Kiosk

This project was created with [@edgeflowjs/create-edgeflow](https://www.npmjs.com/package/@edgeflowjs/create-edgeflow).

## Quick Start

```bash
pnpm exec edgeflow dev
```

Opens the kiosk app at [http://localhost:5173](http://localhost:5173) with the core backend.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Core + kiosk app (same as `edgeflow dev`) |
| `pnpm run dev:app` | Kiosk UI only (core must run separately) |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build locally |
| `pnpm run typecheck` | Run TypeScript check |

## CLI Commands

Use `pnpm exec edgeflow <command>` or install the CLI globally:

| Command | Description |
|---------|-------------|
| `edgeflow dev` | Start core + kiosk app |
| `edgeflow build` | Build for production |
| `edgeflow deploy` | Deploy to local device |
| `edgeflow deploy --host <ip>` | Deploy to Raspberry Pi via SSH |
| `edgeflow logs` | Show core logs |
| `edgeflow logs --host <ip>` | Show remote logs |
| `edgeflow restart` | Restart core |
| `edgeflow restart --host <ip>` | Restart remote core |
| `edgeflow doctor` | Check device status |
| `edgeflow doctor --host <ip>` | Check remote device |
| `edgeflow simulate` | Run device simulator |
| `edgeflow update` | Update dependencies |

## Project Structure

```
src/
├── App.tsx           # Main app + flow
├── bridge/           # Bridge client (UI ↔ core)
├── components/       # Layout components
├── screens/          # Flow screens (Idle, Scan, Action, ThankYou, Maintenance)
├── locales/          # i18n (en, fr)
└── hooks/            # Custom hooks
```

## Important

- **Environment:** Copy `.env.example` to `.env` and configure `VITE_BRIDGE_URL` (default: `ws://localhost:19707`).
- **Deploy to Pi:** Run `edgeflow build` then `edgeflow deploy --host <raspberry-ip>`.
- **Maintenance:** Access maintenance panel at `/maintenance` (unlock via token).
- **Updates:** `pnpm update @edgeflowjs/*` to get latest packages.

## Learn More

- [EdgeFlow documentation](https://github.com/christophe77/edgeflow)
- [Getting started guide](https://github.com/christophe77/edgeflow/blob/main/docs/guides/getting-started.md)
- [Deployment guide](https://github.com/christophe77/edgeflow/blob/main/docs/guides/deployment.md)
