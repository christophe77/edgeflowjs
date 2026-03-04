# Contributing to EdgeFlow

Thank you for your interest in contributing to EdgeFlow. This document outlines the process and guidelines.

## Prerequisites

- **Node.js** >= 18
- **pnpm** (`npm install -g pnpm`)

## Development Setup

```bash
git clone https://github.com/christophe77/edgeflow.git
cd edgeflow
pnpm install
pnpm build
```

## Code Style

- **TypeScript:** Strict mode enabled. Use explicit types where inference is unclear.
- **ESLint:** Run `pnpm lint` before committing. The project uses ESLint with boundary rules.
- **Formatting:** Follow existing conventions (2 spaces, trailing commas where applicable).

## Branch Naming

- `fix/` — Bug fixes (e.g. `fix/bridge-reconnect`)
- `feat/` — New features (e.g. `feat/flow-guards`)
- `docs/` — Documentation only (e.g. `docs/api-reference`)

## Pull Request Process

1. Create a branch from `main`.
2. Make your changes. Ensure `pnpm build` and `pnpm lint` pass.
3. Run `pnpm typecheck` to verify types.
4. Open a PR with a clear description of the change.
5. Link any related issues.

## Running Tests

```bash
pnpm test       # Run tests in watch mode
pnpm test:run   # Run tests once
pnpm typecheck  # Type-check all packages
pnpm lint       # Lint with ESLint
pnpm build      # Build all packages
```

Tests use Vitest and cover flow, bridge, and sync packages. Add tests in `packages/<name>/src/*.test.ts`.

## Project Structure

- `packages/` — Core packages (flow, bridge, sync, device, etc.)
- `apps/` — Applications (example-kiosk, devtools)
- `docs/` — Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for package boundaries and dependency rules.
