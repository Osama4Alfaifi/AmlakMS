"use client";

import { useAuth } from "@/lib/auth-context";
import { roleMeta } from "./nav-config";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export function Topbar({ title, onMenuClick }: { title?: string; onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="no-print sticky top-0 z-30 min-h-16 bg-background/85 backdrop-blur-md border-b border-border/80 flex items-center justify-between gap-3 px-4 lg:px-8 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="pressable lg:hidden grid place-items-center h-11 w-11 -mr-2 rounded-xl text-foreground/70 hover:bg-surface-sunken hover:text-foreground"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-base lg:text-lg font-extrabold text-foreground truncate">{title ?? roleMeta[user.role].title}</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex flex-col items-end leading-tight me-1">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-[11px] text-muted">{roleMeta[user.role].title}</span>
        </div>
        <div
          aria-hidden
          className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold shadow-control"
        >
          {user.name.charAt(0)}
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
          className="pressable grid place-items-center h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-muted hover:text-danger-600 hover:bg-danger-50"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
