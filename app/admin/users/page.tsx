"use client";

import { Fragment, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useAllUserProfiles, useOwners, useRoles, useSystemUsers } from "@/lib/firestore/hooks";
import { updateUserOwnerIds, updateUserRole } from "@/lib/firestore/mutations";
import type { Role } from "@/lib/types";
import { ChevronDown, ChevronUp, Search, TriangleAlert } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  owner: "مالك",
  tenant: "مستأجر",
  technician: "فني صيانة",
  accountant: "محاسب",
  leasingAgent: "الوسيط",
  maintenanceStaff: "فريق صيانة",
  custom: "دور مخصص",
  "مدير حساب": "مدير حساب",
};

const ASSIGNABLE_ROLES: Role[] = [
  "admin",
  "owner",
  "tenant",
  "technician",
  "accountant",
  "leasingAgent",
  "maintenanceStaff",
  "custom",
];

export default function AdminUsersPage() {
  // profiles (users/{uid}) is the authoritative account list — id here is
  // the real Firebase Auth uid, which updateUserOwnerIds needs. systemUsers
  // is a separate legacy read-model keyed by business-record id (e.g.
  // "own-1"), not uid, and never got backfilled for accountant/leasingAgent/
  // maintenanceStaff — it's only good for its status/lastLogin display
  // fields, joined here by email since that's the one field both share.
  const { user: me } = useAuth();
  const { data: profiles } = useAllUserProfiles();
  const { data: systemUsers } = useSystemUsers();
  const { data: owners } = useOwners();
  const { data: roles } = useRoles();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftOwnerIds, setDraftOwnerIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingRoleUid, setSavingRoleUid] = useState<string | null>(null);

  const systemUserByEmail = useMemo(() => new Map(systemUsers.map((u) => [u.email, u])), [systemUsers]);

  const rows = useMemo(
    () =>
      profiles.map((p) => {
        const su = systemUserByEmail.get(p.email);
        return {
          uid: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
          customRoleId: p.customRoleId ?? null,
          ownerIds: p.ownerIds ?? [],
          status: su?.status ?? "نشط",
          lastLogin: su?.lastLogin ?? "—",
        };
      }),
    [profiles, systemUserByEmail]
  );

  // Both roles use the same ownerIds many-to-many link (see
  // lib/accountant-scope.tsx and firestore.rules' isMyOwner()) — an
  // accountant's assigned owners for their bookkeeping scope, a leasing
  // agent's for their managed portfolio.
  const scopedRows = useMemo(() => rows.filter((r) => r.role === "accountant" || r.role === "leasingAgent"), [rows]);

  const unassignedOwners = useMemo(() => {
    const assigned = new Set(scopedRows.flatMap((r) => r.ownerIds));
    return owners.filter((o) => !assigned.has(o.id));
  }, [owners, scopedRows]);

  const filtered = useMemo(
    () => rows.filter((r) => r.name.includes(query) || r.email.toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );

  function startEditing(uid: string, currentOwnerIds: string[]) {
    setExpandedId(expandedId === uid ? null : uid);
    setDraftOwnerIds(currentOwnerIds);
  }

  function toggleOwner(ownerId: string) {
    setDraftOwnerIds((prev) => (prev.includes(ownerId) ? prev.filter((id) => id !== ownerId) : [...prev, ownerId]));
  }

  async function handleSave(uid: string) {
    setSaving(true);
    await updateUserOwnerIds(uid, draftOwnerIds);
    setSaving(false);
    setExpandedId(null);
  }

  async function handleRoleChange(uid: string, role: Role, currentCustomRoleId: string | null) {
    setSavingRoleUid(uid);
    await updateUserRole(uid, role, role === "custom" ? currentCustomRoleId : undefined);
    setSavingRoleUid(null);
  }

  async function handleCustomRoleChange(uid: string, customRoleId: string) {
    setSavingRoleUid(uid);
    await updateUserRole(uid, "custom", customRoleId);
    setSavingRoleUid(null);
  }

  return (
    <DashboardShell allow={["admin"]} title="عدد المستخدمين">
      <div className="flex flex-col gap-6">
        {unassignedOwners.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm font-semibold text-warning-700">
            <TriangleAlert size={16} className="shrink-0 mt-0.5" />
            <span>
              الملاك التالية بدون محاسب أو وسيط مرتبط: {unassignedOwners.map((o) => o.name).join("، ")}
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>جميع المستخدمين</CardTitle>
              <CardSubtitle>{rows.length} مستخدم مسجّل في النظام — اضغط على صف محاسب أو وسيط لربطه بالملاك</CardSubtitle>
            </div>
            <div className="relative w-56">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="بحث بالاسم أو البريد" value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th></Th>
                  <Th>الاسم</Th>
                  <Th>البريد الإلكتروني</Th>
                  <Th>الدور</Th>
                  <Th>الملاك المرتبطون</Th>
                  <Th>الحالة</Th>
                  <Th>آخر دخول</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((r) => {
                  const hasOwnerScope = r.role === "accountant" || r.role === "leasingAgent";
                  const isOpen = expandedId === r.uid;
                  const myOwners = owners.filter((o) => r.ownerIds.includes(o.id));
                  return (
                    <Fragment key={r.uid}>
                      <Tr className={hasOwnerScope ? "cursor-pointer" : ""} onClick={() => hasOwnerScope && startEditing(r.uid, r.ownerIds)}>
                        <Td className="w-8 text-muted">
                          {hasOwnerScope && (isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </Td>
                        <Td className="font-semibold">{r.name}</Td>
                        <Td className="text-muted">{r.email}</Td>
                        <Td onClick={(ev) => ev.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={r.role}
                              disabled={savingRoleUid === r.uid || r.uid === me?.uid}
                              title={r.uid === me?.uid ? "لا يمكنك تغيير دورك الخاص" : undefined}
                              onChange={(e) => handleRoleChange(r.uid, e.target.value as Role, r.customRoleId)}
                              className="w-36 py-1.5 text-xs"
                            >
                              {ASSIGNABLE_ROLES.map((role) => (
                                <option key={role} value={role}>{roleLabels[role] ?? role}</option>
                              ))}
                            </Select>
                            {r.role === "custom" && (
                              <Select
                                value={r.customRoleId ?? ""}
                                disabled={savingRoleUid === r.uid || r.uid === me?.uid}
                                onChange={(e) => handleCustomRoleChange(r.uid, e.target.value)}
                                className="w-32 py-1.5 text-xs"
                              >
                                <option value="" disabled>اختر دورًا</option>
                                {roles.map((cr) => (
                                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                                ))}
                              </Select>
                            )}
                          </div>
                        </Td>
                        <Td className="text-muted max-w-[220px] truncate">
                          {hasOwnerScope ? (myOwners.length > 0 ? myOwners.map((o) => o.name).join("، ") : "بدون") : "—"}
                        </Td>
                        <Td><Badge tone={r.status === "نشط" ? "success" : "danger"}>{r.status}</Badge></Td>
                        <Td className="text-muted">{r.lastLogin}</Td>
                      </Tr>
                      {isOpen && hasOwnerScope && (
                        <Tr className="bg-background">
                          <Td colSpan={7} className="py-4 whitespace-normal align-top">
                            <div className="pr-8 flex flex-col gap-3 max-w-lg">
                              <p className="text-xs font-semibold text-muted">الملاك الذين يديرهم {r.name}</p>
                              <div className="flex flex-col gap-2">
                                {owners.map((o) => (
                                  <label key={o.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={draftOwnerIds.includes(o.id)}
                                      onChange={() => toggleOwner(o.id)}
                                      className="h-4 w-4 rounded border-border accent-brand-600"
                                    />
                                    {o.name}
                                  </label>
                                ))}
                                {owners.length === 0 && <p className="text-sm text-muted">لا يوجد ملاك مسجّلون بعد</p>}
                              </div>
                              <Button size="sm" disabled={saving} onClick={() => handleSave(r.uid)} className="self-start">
                                {saving ? "جارِ الحفظ..." : "حفظ"}
                              </Button>
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
