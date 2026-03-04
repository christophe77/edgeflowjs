# OTA Update

EdgeFlow supports over-the-air updates via a manifest URL and tarball distribution.

## Configuration

Set `OTA_MANIFEST_URL` in `.env`:

```
OTA_MANIFEST_URL=https://your-server.com/ota/manifest.json
```

## Manifest Format

The manifest is a JSON file:

```json
{
  "version": "0.2.0",
  "publishedAt": 1700000000000,
  "minHwRevision": "Raspberry Pi 4",
  "entrypoint": "https://your-server.com/ota/edgeflow-0.2.0.tar.gz",
  "sha256": "abc123...",
  "signature": "..."
}
```

| Field | Description |
|-------|-------------|
| version | Semver (e.g. 0.2.0) |
| publishedAt | Unix timestamp (ms) |
| minHwRevision | Optional minimum hardware |
| entrypoint | URL to .tar.gz (absolute or relative to manifest URL) |
| sha256 | SHA256 hash of the tarball |
| signature | Optional Ed25519 signature (verifier stub) |

## Flow

1. **check()** — Fetches manifest, compares version with current (`package.json`), returns `{ available, manifest }`.
2. **apply(version)** — Downloads tarball, verifies SHA256, extracts to temp, writes staging marker to `data/ota/staging/`.

## Post-Apply

After `apply()` completes, the extracted files are in a temp directory. A separate script or systemd unit should:
- Copy files to the app directory
- Restart the service

The staging marker at `data/ota/staging/version.txt` and `path.txt` indicates the update is ready.
