export type StoragePort = {
  diskUsage(path: string): Promise<{ total: number; used: number; free: number }>;
};
