import { english } from "./translations";

export type Locale = "zh-CN" | "en";
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_STORAGE_KEY = "studypilot:locale";
export const normalizeCopy = (value: string) =>
  value.replace(/\s+/g, " ").trim();
const chinese = new Map(
  Object.entries(english).map(([zh, en]) => [normalizeCopy(en), zh]),
);

export function translateText(
  key: string,
  locale: Locale,
  ...values: Array<string | number>
): string {
  const template =
    locale === "en"
      ? (english[normalizeCopy(key)] ?? key)
      : (chinese.get(normalizeCopy(key)) ?? key);
  return template.replace(/\{(\d+)\}/g, (match, index) =>
    values[Number(index)] === undefined ? match : String(values[Number(index)]),
  );
}

let current: Locale | undefined;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  if (current) return current;
  try {
    current =
      window.localStorage.getItem(LOCALE_STORAGE_KEY) === "en"
        ? "en"
        : DEFAULT_LOCALE;
  } catch {
    current = DEFAULT_LOCALE;
  }
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale === "en" ? "en" : DEFAULT_LOCALE;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, current);
  } catch {
    // Restricted storage must not prevent switching during this visit.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  const changed = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
      current = undefined;
      listener();
    }
  };
  window.addEventListener("storage", changed);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", changed);
  };
}

export function translate(
  key: string,
  ...values: Array<string | number>
): string {
  return translateText(key, getLocale(), ...values);
}
