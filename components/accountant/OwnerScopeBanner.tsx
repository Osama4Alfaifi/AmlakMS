"use client";

import { Select } from "@/components/ui/Input";
import type { AccountantOwnerScope } from "@/lib/accountant-scope";
import { Building2, TriangleAlert } from "lucide-react";

// Renders nothing for admin (their view is unchanged — everything, no
// owner selector). For an accountant, makes it unambiguous which owner's
// portfolio the page below is scoped to, and lets them switch — see
// lib/accountant-scope.ts for how that selection is computed/persisted.
export function OwnerScopeBanner({ scope }: { scope: AccountantOwnerScope }) {
  if (!scope.isAccountant) return null;

  if (scope.myOwners.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm font-semibold text-warning-700">
        <TriangleAlert size={16} />
        لا يوجد مالك مرتبط بحسابك بعد — تواصل مع الإدارة لربطك بملّاك لتتمكّن من عرض بياناتهم.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
      <Building2 size={16} className="text-brand-700 shrink-0" />
      <span className="text-sm font-semibold text-brand-700 whitespace-nowrap">أنت تستعرض عقارات:</span>
      <Select
        value={scope.selectedOwnerId ?? ""}
        onChange={(e) => scope.selectOwner(e.target.value)}
        className="w-56 bg-surface"
      >
        {scope.myOwners.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </Select>
    </div>
  );
}
