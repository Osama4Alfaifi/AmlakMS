"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";
import { useRequireAuth } from "@/lib/auth-context";
import { MobileSidebar, Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({
  allow,
  title,
  children,
}: {
  allow: Role[];
  title?: string;
  children: React.ReactNode;
}) {
  const { user, ready } = useRequireAuth(allow);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        جارِ التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role={user.role} />
      <MobileSidebar role={user.role} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
