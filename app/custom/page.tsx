"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useCustomRole } from "@/lib/firestore/hooks";
import { customResourceNav } from "@/components/layout/nav-config";
import type { PermissionResource } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export default function CustomRoleHomePage() {
  const { user } = useAuth();
  const customRole = useCustomRole(user?.customRoleId);
  const granted = Object.entries(customRole?.permissions ?? {}).filter(([, perm]) => perm?.read);

  return (
    <DashboardShell allow={["custom"]} title={`أهلًا، ${user?.name ?? ""}`}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{customRole?.name ?? "دورك المخصص"}</CardTitle>
            <CardSubtitle>الصفحات المتاحة لك حسب الصلاحيات التي حددها مدير النظام</CardSubtitle>
          </div>
        </CardHeader>
        <CardContent>
          {granted.length === 0 ? (
            <p className="text-sm text-muted py-4">لم يتم منح دورك صلاحية الوصول لأي صفحة بعد — تواصل مع مدير النظام.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {granted.map(([resource]) => {
                const nav = customResourceNav[resource as PermissionResource];
                if (!nav) return null;
                return (
                  <Link key={resource} href={nav.href}>
                    <Button variant="outline" className="w-full justify-between">
                      <nav.icon size={15} className="ms-1" /> {nav.label} <ArrowLeft size={15} />
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
