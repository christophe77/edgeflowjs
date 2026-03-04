import { createContext, useContext, type ReactNode } from "react";
import type { I18n } from "./index.js";

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider(props: { i18n: I18n; children: ReactNode }) {
  return (
    <I18nContext.Provider value={props.i18n}>{props.children}</I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n must be used within I18nProvider");
  return i18n;
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const i18n = useI18n();
  return i18n.t.bind(i18n);
}
