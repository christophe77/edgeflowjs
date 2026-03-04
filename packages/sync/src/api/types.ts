export type OutboxStatus = "pending" | "sent" | "failed";

export type OutboxEvent = {
  id: string;
  type: string;
  payload: unknown;
  occurredAt: number;
  idempotencyKey: string;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt?: number;
  lastError?: string;
  traceId?: string;
};

export type SyncStore = {
  outboxEnqueue(evt: Omit<OutboxEvent, "status" | "retryCount">): Promise<OutboxEvent>;
  outboxList(filter?: { status?: OutboxStatus; limit?: number }): Promise<OutboxEvent[]>;
  outboxMarkSent(id: string): Promise<void>;
  outboxMarkFailed(id: string, err: string, nextRetryAt: number): Promise<void>;
  outboxDelete(id: string): Promise<void>;
  close(): Promise<void>;
};

export type SyncEngine = {
  start(): Promise<void>;
  stop(): Promise<void>;
  enqueue(
    type: string,
    payload: unknown,
    opts: { idempotencyKey: string; traceId?: string }
  ): Promise<OutboxEvent>;
  stats(): Promise<{ pending: number; failed: number }>;
  retry(ids?: string[]): Promise<void>;
  onStats(handler: (s: { pending: number; failed: number }) => void): () => void;
};
