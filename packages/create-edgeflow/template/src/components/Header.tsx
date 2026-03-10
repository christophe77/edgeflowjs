import { useState, useEffect } from "react";
import { useI18n } from "@edgeflowjs/i18n/react";

export default function Header() {
  const i18n = useI18n();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = i18n.formatDate(now, { weekday: "short", day: "numeric", month: "short" });
  const timeStr = i18n.formatDate(now, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <header className="header">
      <span className="header__logo" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
        EdgeFlow
      </span>
      <div className="header__datetime">
        <span className="header__date">{dateStr}</span>
        <span className="header__time">{timeStr}</span>
      </div>
    </header>
  );
}
