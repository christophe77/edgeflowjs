# create-edgeflow

Scaffold a new EdgeFlow kiosk project without cloning the monorepo.

## Usage

```bash
npx @edgeflowjs/create-edgeflow my-kiosk
cd my-kiosk
pnpm install
pnpm exec edgeflow dev
```

Or create in the current directory:

```bash
npx @edgeflowjs/create-edgeflow .
```

## What you get

- Vite + React kiosk app
- Flow (Idle → Scan → Action → ThankYou)
- Maintenance panel
- i18n (en/fr)
- Bridge client for core communication

## Deploy to Raspberry Pi

```bash
pnpm exec edgeflow build
pnpm exec edgeflow deploy --host <raspberry-ip>
```

## Documentation

See [EdgeFlow docs](https://github.com/christophe77/edgeflow) for full documentation.
