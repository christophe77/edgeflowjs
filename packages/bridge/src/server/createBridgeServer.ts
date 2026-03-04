import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import type { Logger } from "@edgeflow/observability";
import type { BridgeEvent, BridgeRequest, BridgeResponse } from "../protocol/index.js";

export type BridgeServer = {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(evt: BridgeEvent): void;
  setRequestHandler(handler: (req: BridgeRequest, respond: (res: BridgeResponse) => void) => void): void;
};

export function createBridgeServer(opts: {
  port: number;
  logger: Logger;
  onRequest?: (req: BridgeRequest, respond: (res: BridgeResponse) => void) => void;
}): BridgeServer {
  const { port, logger } = opts;
  let requestHandler = opts.onRequest ?? null;
  let wss: WebSocketServer | null = null;
  let httpServer: ReturnType<typeof createServer> | null = null;
  const clients = new Set<{ send: (data: string) => void }>();

  return {
    setRequestHandler(handler) {
      requestHandler = handler;
    },
    async start() {
      return new Promise((resolve, reject) => {
        httpServer = createServer();
        httpServer.listen({ port, reuseAddr: true }, () => {
          wss = new WebSocketServer({ server: httpServer!, perMessageDeflate: false });
          wss.on("connection", (ws) => {
          const client = { send: (data: string) => ws.send(data) };
          clients.add(client);
          ws.on("close", () => clients.delete(client));
          ws.on("message", (raw) => {
            try {
              const msg = JSON.parse(raw.toString()) as BridgeRequest & { id?: string };
              if (msg.type === "ping") {
                const res: BridgeResponse = { id: crypto.randomUUID(), type: "pong", ts: Date.now(), payload: { requestId: msg.id } };
                ws.send(JSON.stringify(res));
                return;
              }
              const requestId = msg.id ?? msg.ts?.toString() ?? "";
              const respond = (res: BridgeResponse) => ws.send(JSON.stringify(res));
              if (requestHandler) requestHandler(msg, respond);
              else respond({ id: crypto.randomUUID(), type: "error", ts: Date.now(), payload: { requestId, code: "NO_HANDLER", message: "No request handler set" } });
            } catch (e) {
              logger.warn("Bridge message parse error", { err: String(e) });
            }
          });
          });
          logger.info(`Bridge server listening on ws://localhost:${port}`);
          resolve();
        });

        httpServer!.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            logger.error(`Port ${port} is already in use. Run "pnpm kill-ports" or set BRIDGE_PORT in .env.`);
          }
          reject(err);
        });
      });
    },

    async stop() {
      return new Promise<void>((resolve) => {
        clients.clear();
        if (wss) {
          wss.close(() => {
            wss = null;
            if (httpServer) {
              httpServer.close(() => {
                httpServer = null;
                resolve();
              });
            } else {
              resolve();
            }
          });
        } else if (httpServer) {
          httpServer.close(() => {
            httpServer = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    publish(evt: BridgeEvent) {
      const payload = {
        ...evt,
        id: evt.id ?? crypto.randomUUID(),
        ts: evt.ts ?? Date.now(),
      };
      const line = JSON.stringify(payload);
      for (const c of clients) {
        try {
          c.send(line);
        } catch (_) {}
      }
    },
  };
}
