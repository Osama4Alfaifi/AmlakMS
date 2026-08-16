"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useCustomRole } from "@/lib/firestore/hooks";
import type { PermissionResource, Role } from "@/lib/types";
import { customResourceNav, navByRole, type NavItem } from "./nav-config";
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
  return (
    <div className="flex items-center justify-between gap-2.5 px-5 min-h-16 border-b border-border shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
          <Building2 size={18} />
        </div>
        <div>
          <p className="text-sm font-extrabold leading-none">أملاك MS</p>
          <p className="text-[11px] text-muted mt-1">نظام إدارة الأملاك</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function NavList({ role, customRoleId, onNavigate }: { role: Role; customRoleId?: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = useNavItems(role, customRoleId);
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25" : "text-foreground/80 hover:bg-background"
            )}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role, customRoleId }: { role: Role; customRoleId?: string | null }) {
  return (
    <aside className="no-print hidden lg:flex w-64 shrink-0 flex-col border-l border-border bg-surface">
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
  return (
    <div
      className={cn(
        "no-print fixed inset-0 z-50 lg:hidden transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        className={cn(
          "absolute top-0 right-0 h-full w-72 bg-surface flex flex-col transition-transform duration-200 pb-[env(safe-area-inset-bottom)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Brand
          action={
            <button onClick={onClose} className="p-2 text-muted hover:text-foreground">
              <X size={20} />
            </button>
          }
        />
        <NavList role={role} customRoleId={customRoleId} onNavigate={onClose} />
      </aside>
    </div>
  );
}
