"use client";

import { useState } from "react";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { OwnerScopeBanner } from "@/components/accountant/OwnerScopeBanner";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useAppSettings, useCustomRole } from "@/lib/firestore/hooks";
import type { PermissionResource, Role } from "@/lib/types";
import { useRequireAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { MobileSidebar, Sidebar } from "./Sidebar";
import { PullToRefresh } from "./PullToRefresh";
import { LogoMark } from "./Logo";
import { PageEnter } from "@/components/motion/PageEnter";
import { Topbar } from "./Topbar";

export function DashboardShell({
  allow,
  title,
  children,
  customResource,
}: {
  allow: Role[];
  title?: string;
  children: React.ReactNode;
  // Only checked for role === "custom" — see CustomRole in lib/types.ts.
  // Pages that map to one of the app's PermissionResource groups pass it so
  // a custom-role account without read access to that resource sees a clear
  // "no permission" message instead of a page whose data Firestore will
  // silently deny anyway. Every other role ignores this entirely.
  customResource?: PermissionResource;
}) {
  const { user, ready } = useRequireAuth(allow);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();
  const settings = useAppSettings();
  const customRole = useCustomRole(user?.role === "custom" ? user.customRoleId : undefined);

  if (!ready || !user) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted text-sm">
        <LogoMark size={44} className="animate-pulse" />
        <span>{t("جارِ التحميل...")}</span>
      </div>
    );
  }

  if (settings?.siteClosed && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center flex flex-col items-center gap-3">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-warning-50 text-warning-600">
            <TriangleAlert size={24} />
          </div>
          <p className="font-bold">{t("النظام مغلق مؤقتًا للصيانة")}</p>
          <p className="text-sm text-muted">{t("يرجى المحاولة لاحقًا، أو التواصل مع الإدارة.")}</p>
        </div>
      </div>
    );
  }

  const customDenied =
    user.role === "custom" && customResource != null && customRole !== undefined && !customRole?.permissions?.[customResource]?.read;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role={user.role} customRoleId={user.customRoleId} />
      <MobileSidebar role={user.role} customRoleId={user.customRoleId} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 w-full px-3 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:px-5 lg:pt-5 lg:pb-6 overflow-x-hidden flex flex-col gap-3 lg:gap-4">
          <PullToRefresh>
            <ShellOwnerScopeBanner />
            {customDenied ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-sm text-center flex flex-col items-center gap-3">
                  <div className="grid place-items-center h-12 w-12 rounded-2xl bg-danger-50 text-danger-600">
                    <ShieldAlert size={24} />
                  </div>
                  <p className="font-bold">{t("ليس لديك صلاحية الوصول لهذه الصفحة")}</p>
                  <p className="text-sm text-muted">{t("تواصل مع مدير النظام إذا كنت بحاجة لهذه الصلاحية.")}</p>
                </div>
              </div>
            ) : (
              <PageEnter>{children}</PageEnter>
            )}
          </PullToRefresh>
        </main>
      </div>
    </div>
  );
}

// One banner instance for the whole shell — pages just read
// useAccountantOwnerScope() for scope.queryOwnerId and no longer render
// their own <OwnerScopeBanner>.
function ShellOwnerScopeBanner() {
  const scope = useAccountantOwnerScope();
  return <OwnerScopeBanner scope={scope} />;
}
