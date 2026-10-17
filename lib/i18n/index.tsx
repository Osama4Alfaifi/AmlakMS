"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLang, setCurrentLang, type Lang } from "./state";
import { translate } from "./translate";

export { translate, tr } from "./translate";

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (text: string) => string;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  dir: "rtl",
  t: (s) => s,
  setLang: () => {},
});

function applyToDocument(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always starts as Arabic so the first client render matches the prerendered HTML.
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      if (localStorage.getItem("lang") === "en") {
        setCurrentLang("en");
        applyToDocument("en");
        setLangState("en");
      }
    } catch {
      // storage blocked — stay Arabic
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem("lang", next);
    } catch {
      // ignore
    }
    setCurrentLang(next);
    applyToDocument(next);
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir: lang === "en" ? "ltr" : "rtl", t: (s) => translate(s, lang), setLang }),
    [lang, setLang]
  );

  // Keyed so every page remounts on a language change and re-reads
  // translated strings and number formats.
  return (
    <LanguageContext.Provider value={value}>
      <div key={lang} className="contents">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useContext(LanguageContext).t;
}
