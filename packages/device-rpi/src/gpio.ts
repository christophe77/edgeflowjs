import type { GpioPort } from "@edgeflowjs/device";

let GpioClass: new (pin: number, direction: string) => {
  read(): Promise<number>;
  write(value: number): Promise<void>;
  watch(cb: (err: Error | null, val: number) => void): void;
  unwatch(cb: (err: Error | null, val: number) => void): void;
  unexport(): void;
} | null = null;

async function loadOnoff() {
  if (GpioClass) return GpioClass;
  try {
    const mod = await import("onoff");
    GpioClass = mod.Gpio ?? mod.default;
    return GpioClass;
  } catch {
    return null;
  }
}

const openPins = new Map<
  number,
  { read(): Promise<number>; write(v: number): Promise<void>; watch(cb: (e: Error | null, v: number) => void): void; unwatch(cb: unknown): void; unexport(): void }
>();

export async function createGpioPort(): Promise<GpioPort> {
  const Gpio = await loadOnoff();
  if (!Gpio) {
    return {
      async open() {
        throw new Error("GPIO not available: onoff not installed or not supported on this platform");
      },
      async read() {
        throw new Error("GPIO not available");
      },
      async write() {
        throw new Error("GPIO not available");
      },
      async watch() {
        throw new Error("GPIO not available");
      },
      async close() {},
    };
  }

  return {
    async open(pin, direction) {
      if (openPins.has(pin)) return;
      const g = new Gpio(pin, direction);
      openPins.set(pin, g);
    },
    async read(pin) {
      const g = openPins.get(pin);
      if (!g) throw new Error(`GPIO ${pin} not open`);
      return (await g.read()) === 1;
    },
    async write(pin, value) {
      const g = openPins.get(pin);
      if (!g) throw new Error(`GPIO ${pin} not open`);
      await g.write(value ? 1 : 0);
    },
    async watch(pin, _edge, handler) {
      const g = openPins.get(pin);
      if (!g) throw new Error(`GPIO ${pin} not open`);
      const cb = (err: Error | null, val: number) => {
        if (!err) handler(val === 1);
      };
      g.watch(cb);
      return Promise.resolve(() => {
        g.unwatch(cb);
      });
    },
    async close(pin) {
      const g = openPins.get(pin);
      if (g) {
        g.unexport();
        openPins.delete(pin);
      }
    },
  };
}
