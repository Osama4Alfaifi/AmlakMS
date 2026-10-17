import { getLang, type Lang } from "./state";
import { en } from "./en";
import type { ReactNode } from "react";

// Arabic is the source language and the key: translate("نص عربي") returns the
// same string in Arabic and the English entry in en.ts, falling back to the
// Arabic text for anything not translated yet, so strings can be wrapped one
// at a time without breaking pages.
export function translate(text: string, lang: Lang = getLang()): string {
  return lang === "en" ? (en[text] ?? text) : text;
}

// For primitives (headings, labels, table heads, buttons, badges): translate
// plain-string children, pass anything richer through untouched.
export function tr(children: ReactNode): ReactNode {
  return typeof children === "string" ? translate(children) : children;
}
