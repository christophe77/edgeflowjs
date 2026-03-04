// Stub for MVP; can add counters/gauges later.
export type Metrics = {
  counter(name: string, value?: number): void;
  gauge(name: string, value: number): void;
};
