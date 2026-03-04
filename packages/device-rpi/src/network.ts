import { networkInterfaces } from "node:os";
import type { NetworkPort, NetworkStatus } from "@edgeflowjs/device";

export function createNetworkPort(): NetworkPort {
  const handlers: ((s: NetworkStatus) => void)[] = [];

  function getStatus(): NetworkStatus {
    const ifaces = networkInterfaces();
    let online = false;
    let kind: NetworkStatus["kind"] = "unknown";
    for (const name of Object.keys(ifaces)) {
      const list = ifaces[name];
      if (!list) continue;
      for (const iface of list) {
        if (iface.internal || iface.family !== "IPv4") continue;
        online = true;
        if (name.startsWith("eth") || name.startsWith("en")) kind = "ethernet";
        else if (name.startsWith("wlan") || name.startsWith("wl")) kind = "wifi";
        break;
      }
      if (online) break;
    }
    return { online, kind };
  }

  return {
    async status() {
      return getStatus();
    },
    async onChange(handler) {
      handlers.push(handler);
      return () => {
        const i = handlers.indexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      };
    },
  };
}
