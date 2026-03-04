import type { BridgeEvent, BridgeRequest, BridgeResponse } from "../protocol/index.js";

export type BridgeClient = {
  request<T = unknown>(req: BridgeRequest): Promise<T>;
  subscribe(handler: (evt: BridgeEvent) => void): () => void;
};

export function createBridgeClient(opts: { url: string; token?: string }): BridgeClient {
  const { url } = opts;
  const subscribers = new Set<(evt: BridgeEvent) => void>();
  let ws: globalThis.WebSocket | null = null;
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  function connect(): Promise<globalThis.WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new globalThis.WebSocket(url);
      socket.onopen = () => resolve(socket);
      socket.onerror = () => reject(new Error("WebSocket error"));
      socket.onmessage = (ev: MessageEvent<string | Blob>) => {
        try {
          const raw = typeof ev.data === "string" ? ev.data : "";
          const msg = JSON.parse(raw) as BridgeEvent | BridgeResponse;
          if ("type" in msg && (msg.type === "pong" || msg.type === "ok" || msg.type === "error")) {
            const res = msg as BridgeResponse & { payload?: { requestId?: string; data?: unknown; code?: string; message?: string } };
            const requestId = res.payload?.requestId ?? res.id;
            const p = requestId ? pending.get(requestId) : null;
            if (p) {
              pending.delete(requestId!);
              if (res.type === "error") p.reject(new Error(res.payload?.message ?? "Unknown error"));
              else p.resolve(res.type === "pong" ? {} : (res.payload as { data?: unknown })?.data);
            }
            return;
          }
          const evt = msg as BridgeEvent;
          for (const sub of subscribers) sub(evt);
        } catch (_) {}
      };
    });
  }

  return {
    async request<T = unknown>(req: BridgeRequest): Promise<T> {
      if (!ws || ws.readyState !== globalThis.WebSocket.OPEN) ws = await connect();
      const id = crypto.randomUUID();
      const envelope = { ...req, id, ts: Date.now() };
      return new Promise<T>((resolve, reject) => {
        pending.set(id, {
          resolve: (v) => resolve(v as T),
          reject,
        });
        ws!.send(JSON.stringify(envelope));
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error("Request timeout"));
          }
        }, 10000);
      });
    },
    subscribe(handler) {
      subscribers.add(handler);
      return () => subscribers.delete(handler);
    },
  };
}
