export type IdentityPort = {
  deviceId(): Promise<string>;
  hwRevision(): Promise<string | null>;
};
