import { createHash } from "node:crypto";
import { createWriteStream, mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createReadStream } from "node:fs";
import * as tar from "tar";
import type { OtaManifest } from "./manifest.js";
import { verifyManifest } from "./verifier.js";

export type OtaStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "downloading"; version: string; progress: number }
  | { state: "verifying"; version: string }
  | { state: "applying"; version: string }
  | { state: "rollback"; version: string; reason: string }
  | { state: "done"; version: string };

export type OtaService = {
  check(): Promise<{ available: boolean; manifest?: OtaManifest }>;
  apply(version: string): Promise<void>;
  status(): Promise<OtaStatus>;
  onStatus(handler: (s: OtaStatus) => void): () => void;
};

const statusHandlers: Array<(s: OtaStatus) => void> = [];
let currentStatus: OtaStatus = { state: "idle" };

function emitStatus(s: OtaStatus) {
  currentStatus = s;
  for (const h of statusHandlers) h(s);
}

function getCurrentVersion(appPath: string): string {
  try {
    const pkgPath = join(appPath, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return pkg.version ?? "0.0.0";
    }
  } catch {}
  return "0.0.0";
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export function createOtaService(opts: { manifestUrl?: string; appPath?: string } = {}): OtaService {
  const manifestUrl = opts.manifestUrl ?? process.env.OTA_MANIFEST_URL;
  const appPath = opts.appPath ?? process.cwd();

  return {
    async check() {
      emitStatus({ state: "checking" });
      if (!manifestUrl) {
        emitStatus({ state: "idle" });
        return { available: false };
      }
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) {
          emitStatus({ state: "idle" });
          return { available: false };
        }
        const manifest = (await res.json()) as OtaManifest;
        if (!verifyManifest(manifest)) {
          emitStatus({ state: "idle" });
          return { available: false };
        }
        const current = getCurrentVersion(appPath);
        const available = compareVersions(manifest.version, current) > 0;
        emitStatus({ state: "idle" });
        return { available, manifest: available ? manifest : undefined };
      } catch {
        emitStatus({ state: "idle" });
        return { available: false };
      }
    },
    async apply(version: string) {
      emitStatus({ state: "checking" });
      if (!manifestUrl) {
        emitStatus({ state: "idle" });
        throw new Error("OTA_MANIFEST_URL not configured");
      }
      const res = await fetch(manifestUrl);
      if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
      const manifest = (await res.json()) as OtaManifest;
      if (manifest.version !== version) throw new Error(`Manifest version ${manifest.version} != requested ${version}`);
      if (!verifyManifest(manifest)) throw new Error("Manifest verification failed");

      const entrypoint = manifest.entrypoint.startsWith("http") ? manifest.entrypoint : new URL(manifest.entrypoint, manifestUrl).href;
      emitStatus({ state: "downloading", version, progress: 0 });

      const tmpDir = join(tmpdir(), `edgeflow-ota-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
      const tarballPath = join(tmpDir, "update.tar.gz");

      const resp = await fetch(entrypoint);
      if (!resp.body) throw new Error("No response body");
      const contentLength = Number(resp.headers.get("content-length")) || 0;
      const writer = createWriteStream(tarballPath);
      const reader = resp.body.getReader();
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        writer.write(Buffer.from(value));
        if (contentLength > 0) {
          emitStatus({ state: "downloading", version, progress: received / contentLength });
        }
      }
      writer.end();
      await new Promise<void>((resolve, reject) => writer.on("finish", resolve).on("error", reject));

      emitStatus({ state: "verifying", version });
      const hash = createHash("sha256");
      const stream = createReadStream(tarballPath);
      for await (const chunk of stream) {
        hash.update(chunk);
      }
      const actualSha = hash.digest("hex");
      if (actualSha !== manifest.sha256) {
        emitStatus({ state: "rollback", version, reason: "SHA256 mismatch" });
        throw new Error(`SHA256 mismatch: expected ${manifest.sha256}, got ${actualSha}`);
      }

      emitStatus({ state: "applying", version });
      const extractDir = join(tmpdir(), `edgeflow-ota-extract-${Date.now()}`);
      mkdirSync(extractDir, { recursive: true });
      await tar.x({ file: tarballPath, cwd: extractDir });

      const stagingDir = join(appPath, "data", "ota", "staging");
      mkdirSync(stagingDir, { recursive: true });
      writeFileSync(join(stagingDir, "version.txt"), version);
      writeFileSync(join(stagingDir, "path.txt"), extractDir);

      emitStatus({ state: "done", version });
    },
    async status() {
      return currentStatus;
    },
    onStatus(handler) {
      statusHandlers.push(handler);
      return () => {
        const i = statusHandlers.indexOf(handler);
        if (i >= 0) statusHandlers.splice(i, 1);
      };
    },
  };
}
