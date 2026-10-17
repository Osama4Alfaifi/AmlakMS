"use client";

import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n";
import { GlobeIcon, MoonIcon, SunIcon } from "@/components/ui/icons";

type Tone = "default" | "onDark";

const toneClasses: Record<Tone, string> = {
  default: "text-foreground/75 hover:bg-surface-sunken hover:text-foreground",
  onDark: "text-white/80 hover:bg-white/10 hover:text-white",
};

// Both icons stay mounted and cross-fade (scale + opacity + blur) with CSS, so
// the swap is interruptible and needs no state: the dark: variant follows the
// data-theme attribute that the inline script in app/layout.tsx sets pre-paint.
export function ThemeToggle({ tone = "default", className }: { tone?: Tone; className?: string }) {
  const { lang } = useLanguage();
  const label = lang === "en" ? "Toggle dark mode" : "تبديل الوضع الليلي";

  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage blocked — the choice just won't persist
    }
  }

  const icon = "absolute inset-0 m-auto transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "pressable relative grid place-items-center h-11 w-11 sm:h-10 sm:w-10 rounded-xl",
        toneClasses[tone],
        className
      )}
    >
      <SunIcon className={cn(icon, "scale-100 opacity-100 blur-none dark:scale-[0.25] dark:opacity-0 dark:blur-[4px]")} />
      <MoonIcon className={cn(icon, "scale-[0.25] opacity-0 blur-[4px] dark:scale-100 dark:opacity-100 dark:blur-none")} />
    </button>
  );
}

export function LangToggle({ tone = "default", className }: { tone?: Tone; className?: string }) {
  const { lang, setLang } = useLanguage();
  const next = lang === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
      title={lang === "en" ? "العربية" : "English"}
      className={cn(
        "pressable inline-flex items-center justify-center gap-1.5 h-11 sm:h-10 min-w-11 px-2.5 sm:px-3 rounded-xl text-sm font-semibold",
        toneClasses[tone],
        className
      )}
    >
      <GlobeIcon width={18} height={18} />
      <span className="hidden sm:inline">{lang === "en" ? "عربي" : "EN"}</span>
    </button>
  );
}
