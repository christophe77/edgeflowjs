# @edgeflow/i18n

Minimal internationalization for EdgeFlow kiosks. Supports multi-locale translation, param substitution, and React integration.

## Install

```bash
pnpm add @edgeflow/i18n
```

## Usage

```ts
import { createI18n } from "@edgeflow/i18n";
import { I18nProvider, useT } from "@edgeflow/i18n/react";

const i18n = createI18n({
  defaultLocale: "en",
  translations: {
    en: { "screen.ready": "Ready" },
    fr: { "screen.ready": "Prêt" },
  },
});

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Screen />
    </I18nProvider>
  );
}

function Screen() {
  const t = useT();
  return <h1>{t("screen.ready")}</h1>;
}
```

## Features

- **Flat or nested keys** — `t("screen.idle.ready")` or nested objects
- **Fallback** — Missing keys fall back to default locale
- **Param substitution** — `t("greeting", { name: "User" })` → `"Hello, User!"`
- **formatDate / formatNumber** — Uses `Intl` with current locale
- **Offline** — All translations bundled at build time

## Documentation

- [Guides: i18n](../../docs/guides/i18n.md) — Setup, adding locales, React usage
- [API: i18n](../../docs/api/i18n.md) — Full API reference
