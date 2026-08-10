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
    <header className="no-print h-16 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 -mr-2 text-muted hover:text-foreground">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-sm lg:text-base font-bold text-foreground">{title ?? roleMeta[user.role].title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-[11px] text-muted">{roleMeta[user.role].title}</span>
        </div>
        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
          {user.name.charAt(0)}
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="p-2 rounded-lg text-muted hover:text-danger-500 hover:bg-danger-50 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
