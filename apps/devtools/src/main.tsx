import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createI18n } from "@edgeflow/i18n";
import { I18nProvider } from "@edgeflow/i18n/react";
import App from "./App";
import en from "./locales/en.json";
import "./index.css";

function Root() {
  const [, setLocale] = useState("en");
  const i18n = useMemo(
    () =>
      createI18n({
        defaultLocale: "en",
        translations: { en: en as Record<string, string> },
        onLocaleChange: setLocale,
      }),
    []
  );
  return (
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
