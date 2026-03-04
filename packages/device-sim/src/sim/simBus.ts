import type { DeviceEvent } from "@edgeflowjs/device";

export type SimBusListener = (evt: DeviceEvent) => void;

const listeners: SimBusListener[] = [];

export function simBusEmit(evt: DeviceEvent): void {
  for (const l of listeners) l(evt);
}

export function simBusSubscribe(listener: SimBusListener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}
