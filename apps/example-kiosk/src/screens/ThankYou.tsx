import { useT } from "@edgeflowjs/i18n/react";

export default function ThankYou() {
  const t = useT();
  return (
    <div className="screen">
      <h1>{t("screen.thankYou.title")}</h1>
      <p>{t("screen.thankYou.returning")}</p>
    </div>
  );
}
