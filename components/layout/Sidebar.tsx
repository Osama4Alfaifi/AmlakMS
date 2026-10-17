"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useCustomRole } from "@/lib/firestore/hooks";
import type { PermissionResource, Role } from "@/lib/types";
import { customResourceNav, navByRole, type NavItem } from "./nav-config";
import { LogoMark } from "./Logo";
import { useT } from "@/lib/i18n";
import { Building2, X } from "lucide-react";

// A "custom" role has no fixed nav — it's whatever resources the admin
// granted it read access to (see app/admin/roles), resolved live from its
// CustomRole doc instead of the static navByRole table.
function useNavItems(role: Role, customRoleId?: string | null): NavItem[] {
  const customRole = useCustomRole(role === "custom" ? customRoleId : undefined);
  if (role !== "custom") return navByRole[role];
  const home: NavItem = { label: "لوحة التحكم", href: "/custom", icon: Building2 };
  const granted = Object.entries(customRole?.permissions ?? {})
    .filter(([, perm]) => perm?.read)
    .map(([resource]) => customResourceNav[resource as PermissionResource]);
  return [home, ...granted];
}

function Brand({ action }: { action?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-2.5 px-5 min-h-16 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3">
        <LogoMark size={34} />
        <div>
          <p className="text-[15px] font-extrabold leading-none text-white">{t("أملاك MS")}</p>
          <p className="text-[11px] text-white/60 mt-1.5 leading-none">{t("نظام إدارة الأملاك")}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function NavList({ role, customRoleId, onNavigate }: { role: Role; customRoleId?: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = useNavItems(role, customRoleId);
  const t = useT();
  // The longest matching href wins, so /admin never lights up beside /admin/contracts.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5 [scrollbar-color:rgb(255_255_255/0.2)_transparent]">
      {items.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3.5 min-h-11 lg:min-h-10 text-sm font-medium",
              "transition-[background-color,color] duration-[var(--duration-quick)] ease-[var(--ease-out)]",
              active ? "bg-white/[0.12] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.75} className={active ? "text-accent-400" : ""} />
            <span className="truncate">{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role, customRoleId }: { role: Role; customRoleId?: string | null }) {
  return (
    <aside className="no-print hidden lg:flex w-64 shrink-0 flex-col bg-brand-950 sticky top-0 h-screen">
      <Brand />
      <NavList role={role} customRoleId={customRoleId} />
    </aside>
  );
}

export function MobileSidebar({
  role,
  customRoleId,
  open,
  onClose,
}: {
  role: Role;
  customRoleId?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={cn("no-print fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-brand-950/55 backdrop-blur-[2px] transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute top-0 start-0 h-full w-[18.5rem] max-w-[85vw] bg-brand-950 flex flex-col pb-[env(safe-area-inset-bottom)] shadow-raised",
          "transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        <Brand
          action={
            <button
              onClick={onClose}
              aria-label={t("إغلاق القائمة")}
              className="pressable grid place-items-center h-11 w-11 rounded-xl text-brand-200 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          }
        />
        <NavList role={role} customRoleId={customRoleId} onNavigate={onClose} />
      </aside>
    </div>
  );
}
