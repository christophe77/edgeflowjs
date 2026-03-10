import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createI18n } from "@edgeflowjs/i18n";
import { I18nProvider } from "@edgeflowjs/i18n/react";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import "./index.css";

function Root() {
  const [, setLocale] = useState("en");
  const i18n = useMemo(
    () =>
      createI18n({
        defaultLocale: "en",
        translations: { en: en as Record<string, string>, fr: fr as Record<string, string> },
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
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);
