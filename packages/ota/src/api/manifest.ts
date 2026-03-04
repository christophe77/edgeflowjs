export type OtaManifest = {
  version: string;
  publishedAt: number;
  minHwRevision?: string;
  entrypoint: string;
  sha256: string;
  signature: string;
};
