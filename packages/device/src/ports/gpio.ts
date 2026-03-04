export type GpioDirection = "in" | "out";
export type GpioEdge = "rising" | "falling" | "both";

export type GpioPort = {
  open(pin: number, direction: GpioDirection): Promise<void>;
  read(pin: number): Promise<boolean>;
  write(pin: number, value: boolean): Promise<void>;
  watch(pin: number, edge: GpioEdge, handler: (value: boolean) => void): Promise<() => void>;
  close(pin: number): Promise<void>;
};
