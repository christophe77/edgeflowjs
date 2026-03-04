import { useT } from "@edgeflow/i18n/react";

export default function Idle({
  onStart,
  connected,
}: {
  onStart: () => void;
  connected: boolean;
}) {
  const t = useT();
  return (
    <div className="screen">
      <h1>{t("screen.idle.ready")}</h1>
      <p>{t("screen.idle.tapToStart")}</p>
      <button type="button" onClick={onStart} disabled={!connected}>
        {t("screen.idle.start")}
      </button>
    </div>
  );
}
