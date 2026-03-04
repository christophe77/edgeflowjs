import { useT } from "@edgeflow/i18n/react";

export default function Scan({
  onQR,
  onCancel,
  connected,
}: {
  onQR: () => void;
  onCancel: () => void;
  connected: boolean;
}) {
  const t = useT();
  return (
    <div className="screen">
      <h1>{t("screen.scan.title")}</h1>
      <p>{t("screen.scan.simulateQrDesc")}</p>
      <button type="button" onClick={onQR} disabled={!connected}>
        {t("screen.scan.simulateQr")}
      </button>
      <button type="button" onClick={onCancel} disabled={!connected}>
        {t("screen.scan.cancel")}
      </button>
    </div>
  );
}
