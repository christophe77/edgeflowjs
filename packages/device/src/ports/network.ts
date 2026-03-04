export type NetworkStatus = { online: boolean; kind?: "ethernet" | "wifi" | "cellular" | "unknown" };

export type NetworkPort = {
  status(): Promise<NetworkStatus>;
  onChange(handler: (s: NetworkStatus) => void): Promise<() => void>;
};
