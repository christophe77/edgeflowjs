export type Locale = string;
export type Translations = Record<string, string | Record<string, string>>;

function getValue(obj: Record<string, unknown>, path: string): string | undefined {
  const direct = obj[path];
  if (typeof direct === "string") return direct;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = params[key];
    return v !== undefined ? String(v) : `{{${key}}}`;
  });
}

export type I18n = {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, params?: Record<string, string | number>): string;
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(n: number, options?: Intl.NumberFormatOptions): string;
};

export function createI18n(opts: {
  defaultLocale: Locale;
  translations: Record<Locale, Translations>;
  onLocaleChange?: (locale: Locale) => void;
}): I18n {
  const { defaultLocale, translations, onLocaleChange } = opts;
  let currentLocale = defaultLocale;

  function t(key: string, params?: Record<string, string | number>): string {
    const localeMap = translations[currentLocale] ?? translations[defaultLocale];
    const fallbackMap = translations[defaultLocale];

    let value: string | undefined;
    if (typeof localeMap === "object" && localeMap !== null) {
      value = getValue(localeMap as Record<string, unknown>, key);
    }
    if (value === undefined && fallbackMap && typeof fallbackMap === "object") {
      value = getValue(fallbackMap as Record<string, unknown>, key);
    }

    return interpolate(value ?? key, params);
  }

  return {
    get locale() {
      return currentLocale;
    },
    setLocale(locale: Locale) {
      if (translations[locale]) {
        currentLocale = locale;
        onLocaleChange?.(locale);
      }
    },
    t,
    formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
      return new Intl.DateTimeFormat(currentLocale, options).format(date);
    },
    formatNumber(n: number, options?: Intl.NumberFormatOptions) {
      return new Intl.NumberFormat(currentLocale, options).format(n);
    },
  };
}
