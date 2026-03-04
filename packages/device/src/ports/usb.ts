export type UsbPort = {
  list(): Promise<{ vendorId: number; productId: number; path?: string }[]>;
};
