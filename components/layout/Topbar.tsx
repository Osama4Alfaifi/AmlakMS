"use client";

import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { roleMeta } from "./nav-config";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { LangToggle, ThemeToggle } from "./Toggles";

export function Topbar({ title, onMenuClick }: { title?: string; onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  if (!user) return null;

  return (
    <header className="no-print sticky top-0 z-30 min-h-14 bg-background/85 backdrop-blur-md border-b border-border/80 flex items-center justify-between gap-2 px-3 lg:px-5 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label={t("فتح القائمة")}
          className="pressable lg:hidden grid place-items-center h-11 w-11 -ms-2 rounded-xl text-foreground/75 hover:bg-surface-sunken hover:text-foreground"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-base lg:text-lg font-bold text-foreground truncate">{title ?? t(roleMeta[user.role].title)}</h1>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <NotificationBell />
        <ThemeToggle />
        <LangToggle />
        <div className="hidden md:flex flex-col items-end leading-tight mx-2">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-[11px] text-muted">{t(roleMeta[user.role].title)}</span>
        </div>
        <div
          aria-hidden
          className="hidden sm:flex h-9 w-9 rounded-full bg-primary text-on-primary items-center justify-center text-sm font-bold shadow-control mx-1"
        >
          {user.name.charAt(0)}
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          aria-label={t("تسجيل الخروج")}
          title={t("تسجيل الخروج")}
          className="pressable grid place-items-center h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-muted hover:text-danger-600 hover:bg-danger-50"
        >
          <LogOut size={18} strokeWidth={1.75} className="rtl:-scale-x-100" />
        </button>
      </div>
    </header>
  );
}
