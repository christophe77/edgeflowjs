import { useT } from "@edgeflow/i18n/react";

export default function Action({
  onComplete,
  connected,
}: {
  onComplete: () => void;
  connected: boolean;
}) {
  const t = useT();
  return (
    <div className="screen">
      <h1>{t("screen.action.title")}</h1>
      <p>{t("screen.action.description")}</p>
      <button type="button" onClick={onComplete} disabled={!connected}>
        {t("screen.action.complete")}
      </button>
    </div>
  );
}
