import { useT, useI18n } from "@edgeflow/i18n/react";

export default function StatusBar({
  connected,
  onMaintenance,
}: {
  connected: boolean;
  onMaintenance: () => void;
}) {
  const t = useT();
  const i18n = useI18n();

  return (
    <footer className="status-bar">
      <div className="status-bar__left">
        <span
          className={`status-bar__dot ${connected ? "connected" : "disconnected"}`}
          aria-hidden
        />
        <span className="status-bar__label">
          {connected ? t("screen.idle.connected") : t("screen.idle.connecting")}
        </span>
      </div>
      <div className="status-bar__center" />
      <div className="status-bar__right">
        <div className="status-bar__locale">
          <button
            type="button"
            className={`status-bar__locale-btn ${i18n.locale === "en" ? "active" : ""}`}
            onClick={() => i18n.setLocale("en")}
            aria-label="English"
          >
            EN
          </button>
          <button
            type="button"
            className={`status-bar__locale-btn ${i18n.locale === "fr" ? "active" : ""}`}
            onClick={() => i18n.setLocale("fr")}
            aria-label="Français"
          >
            FR
          </button>
        </div>
        <button
          type="button"
          className="status-bar__maintenance"
          onClick={onMaintenance}
          title={t("nav.maintenance")}
        >
          {t("nav.maintenance")}
        </button>
      </div>
    </footer>
  );
}
