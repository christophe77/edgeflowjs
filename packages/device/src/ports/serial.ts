export type SerialPortConfig = { baudRate: number };

export type SerialPort = {
  open(path: string, cfg: SerialPortConfig): Promise<void>;
  send(path: string, data: Uint8Array): Promise<void>;
  onData(path: string, handler: (data: Uint8Array) => void): Promise<() => void>;
  close(path: string): Promise<void>;
};
