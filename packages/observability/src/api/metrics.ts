const counters = new Map<string, number>();
const gauges = new Map<string, number>();

export type Metrics = {
  counter(name: string, value?: number): void;
  gauge(name: string, value: number): void;
  getCounters(): Map<string, number>;
  getGauges(): Map<string, number>;
};

export function createMetrics(): Metrics {
  return {
    counter(name: string, value = 1) {
      counters.set(name, (counters.get(name) ?? 0) + value);
    },
    gauge(name: string, value: number) {
      gauges.set(name, value);
    },
    getCounters() {
      return new Map(counters);
    },
    getGauges() {
      return new Map(gauges);
    },
  };
}

/**
 * Prometheus text format for /metrics endpoint.
 */
export function toPrometheusText(metrics: Metrics): string {
  const lines: string[] = [];
  for (const [name, value] of metrics.getCounters()) {
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${value}`);
  }
  for (const [name, value] of metrics.getGauges()) {
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${value}`);
  }
  return lines.join("\n") + "\n";
}
