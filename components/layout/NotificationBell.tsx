"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useAppSettings, useOwnerContracts, useOwnerProperties, useTenants } from "@/lib/firestore/hooks";
import { computeNotifications } from "@/lib/notifications";
import { useDismissedNotifications } from "@/lib/use-dismissed-notifications";
import { useLanguage } from "@/lib/i18n";
import { Badge } from "@/components/ui/Badge";
import type { Role } from "@/lib/types";

const BELL_ROLES: Role[] = ["owner", "admin", "accountant", "leasingAgent"];

export function NotificationBell() {
  const { user } = useAuth();
  if (!user || !BELL_ROLES.includes(user.role)) return null;
  return <BellMenu role={user.role} linkedId={user.linkedId} />;
}

// Split out so the data hooks only run for roles allowed to read this data.
function BellMenu({ role, linkedId }: { role: Role; linkedId?: string | null }) {
  const { t } = useLanguage();
  const scope = useAccountantOwnerScope();
  // owner -> their own id; accountant / leasing agent -> their assigned owner
  // scope; admin -> null (unconstrained), same rule the dashboards follow.
  const ownerId = role === "owner" ? linkedId ?? undefined : scope.queryOwnerId;
  const { data: contracts } = useOwnerContracts(ownerId);
  const { data: properties } = useOwnerProperties(ownerId);
  const { data: tenants } = useTenants();
  const settings = useAppSettings();
  const { isDismissed, dismiss } = useDismissedNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const all = computeNotifications(contracts, properties, tenants, {
    contract: settings?.notificationLeadDays ?? 30,
    payment: 14,
  }).filter((n) => !isDismissed(n.id));
  const shown = all.slice(0, 8);
  const count = all.length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("الإشعارات")}
        aria-expanded={open}
        className="pressable relative grid place-items-center h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-foreground/75 hover:bg-surface-sunken hover:text-foreground"
      >
        <Bell size={20} strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-1.5 end-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold leading-[1.1rem] text-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <div
        className={cn(
          "absolute end-0 top-full mt-2 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl bg-surface shadow-raised",
          "transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]",
          open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-bold text-sm">{t("الإشعارات")}</p>
          {count > shown.length && <span className="text-xs text-muted">+{count - shown.length}</span>}
        </div>
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{t("لا توجد إشعارات حاليًا")}</p>
        ) : (
          <ul className="max-h-[min(26rem,70vh)] overflow-y-auto divide-y divide-border">
            {shown.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5">
                  <Badge tone={n.type === "عقد قرب الانتهاء" ? "warning" : "info"}>{t(n.type)}</Badge>
                  <span className="leading-relaxed">{n.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  aria-label={t("إخفاء هذا الإشعار")}
                  className="pressable hit-44 grid place-items-center h-8 w-8 rounded-lg text-muted hover:text-danger-600 hover:bg-danger-50 shrink-0"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
