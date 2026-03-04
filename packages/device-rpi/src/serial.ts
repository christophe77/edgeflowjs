import type { SerialPort, SerialPortConfig } from "@edgeflowjs/device";

let SerialPortClass: new (opts: { path: string; baudRate: number; autoOpen?: boolean }) => {
  open(cb?: (err: Error | null) => void): void;
  write(data: Buffer | string, cb?: (err: Error | null) => void): void;
  on(event: "data", handler: (data: Buffer) => void): void;
  close(cb?: (err: Error | null) => void): void;
} | null = null;

async function loadSerialport() {
  if (SerialPortClass) return SerialPortClass;
  try {
    const mod = await import("serialport");
    SerialPortClass = mod.SerialPort ?? mod.default;
    return SerialPortClass;
  } catch {
    return null;
  }
}

const openPorts = new Map<string, InstanceType<NonNullable<typeof SerialPortClass>>>();

export async function createSerialPort(): Promise<SerialPort> {
  const SerialPort = await loadSerialport();
  if (!SerialPort) {
    return {
      async open() {
        throw new Error("SerialPort not available: serialport not installed");
      },
      async send() {
        throw new Error("SerialPort not available");
      },
      async onData() {
        throw new Error("SerialPort not available");
      },
      async close() {},
    };
  }

  return {
    async open(path, cfg) {
      return new Promise((resolve, reject) => {
        const port = new SerialPort({ path, baudRate: cfg.baudRate, autoOpen: false });
        openPorts.set(path, port);
        port.open((err) => (err ? reject(err) : resolve()));
      });
    },
    async send(path, data) {
      const port = openPorts.get(path);
      if (!port) throw new Error(`Serial port ${path} not open`);
      return new Promise((resolve, reject) => {
        port.write(Buffer.from(data), (err) => (err ? reject(err) : resolve()));
      });
    },
    async onData(path, handler) {
      const port = openPorts.get(path);
      if (port) {
        port.on("data", (d: Buffer) => handler(new Uint8Array(d)));
      }
      return Promise.resolve(() => {});
    },
    async close(path) {
      const port = openPorts.get(path);
      if (port) {
        openPorts.delete(path);
        return new Promise((resolve) => port.close(() => resolve()));
      }
    },
  };
}
