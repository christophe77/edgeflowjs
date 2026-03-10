import { useState } from "react";
import { useT } from "@edgeflowjs/i18n/react";
import { bridgeClient } from "../bridge/bridgeClient";

export default function Maintenance({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [token, setToken] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [injectData, setInjectData] = useState("QR:123456");

  const handleUnlock = async () => {
    if (!token.trim()) {
      setMessage(t("screen.maintenance.enterToken"));
      return;
    }
    try {
      const data = await bridgeClient.request({
        id: crypto.randomUUID(),
        type: "maintenance.unlock",
        ts: Date.now(),
        payload: { method: "qr", token: token.trim() },
      });
      const s = data as { sessionId: string };
      setSessionId(s.sessionId);
      setMessage(t("screen.maintenance.unlocked"));
    } catch (e) {
      setMessage(String(e));
    }
  };

  const handleInjectSerial = async () => {
    if (!sessionId) {
      setMessage(t("screen.maintenance.unlockFirst"));
      return;
    }
    try {
      await bridgeClient.request({
        id: crypto.randomUUID(),
        type: "maintenance.action",
        ts: Date.now(),
        payload: {
          sessionId,
          action: "device.injectSerial",
          input: { port: "/dev/ttyUSB0", data: injectData },
        },
      });
      setMessage(t("screen.maintenance.serialInjected"));
    } catch (e) {
      setMessage(String(e));
    }
  };

  return (
    <div className="screen screen--maintenance">
      <h1>{t("screen.maintenance.title")}</h1>
      <div className="screen__field">
        <input
          type="text"
          placeholder={t("screen.maintenance.tokenPlaceholder")}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button type="button" onClick={handleUnlock}>
          {t("screen.maintenance.unlock")}
        </button>
      </div>
      {sessionId && (
        <div className="screen__field">
          <input
            type="text"
            placeholder={t("screen.maintenance.serialPlaceholder")}
            value={injectData}
            onChange={(e) => setInjectData(e.target.value)}
          />
          <button type="button" onClick={handleInjectSerial}>
            {t("screen.maintenance.injectSerial")}
          </button>
        </div>
      )}
      {message && <p className="status">{message}</p>}
      <button type="button" onClick={onBack}>
        {t("screen.maintenance.back")}
      </button>
    </div>
  );
}
