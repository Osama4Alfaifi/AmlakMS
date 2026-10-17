// Plain module (no "use client") so non-component helpers such as currency()
// can read the active language. The LanguageProvider keeps it in sync, and a
// language change remounts the page tree, so nothing renders with a stale value.
export type Lang = "ar" | "en";

let current: Lang = "ar";

export function getLang(): Lang {
  return current;
}

export function setCurrentLang(lang: Lang) {
  current = lang;
}

export function numberLocale(): string {
  return current === "en" ? "en-US" : "ar-SA";
}
