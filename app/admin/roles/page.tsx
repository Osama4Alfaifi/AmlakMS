"use client";

import { Fragment, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { customResourceNav } from "@/components/layout/nav-config";
import { useRoles } from "@/lib/firestore/hooks";
import { createRole, deleteRole, updateRole } from "@/lib/firestore/mutations";
import type { CustomRole, PermissionResource, RolePermission } from "@/lib/types";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

const RESOURCES = Object.keys(customResourceNav) as PermissionResource[];

function emptyPermissions(): Partial<Record<PermissionResource, RolePermission>> {
  return {};
}

export default function AdminRolesPage() {
  const { data: roles } = useRoles();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState(emptyPermissions());
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggle(resource: PermissionResource, action: "read" | "write") {
    setPermissions((prev) => {
      const current = prev[resource] ?? {};
      const nextValue = !current[action];
      const nextResource: RolePermission = { ...current, [action]: nextValue };
      // write implies read — a role that can edit a resource but can't even
      // see it makes no practical sense in this app's UI.
      if (action === "write" && nextValue) nextResource.read = true;
      if (action === "read" && !nextValue) nextResource.write = false;
      return { ...prev, [resource]: nextResource };
    });
  }

  function startCreate() {
    setEditingId(null);
    setName("");
    setPermissions(emptyPermissions());
    setShowForm(true);
  }

  function startEdit(role: CustomRole) {
    setEditingId(role.id);
    setName(role.name);
    setPermissions(role.permissions ?? {});
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    if (editingId) {
      await updateRole(editingId, { name, permissions });
    } else {
      await createRole({ name, permissions, createdAt: new Date().toISOString().slice(0, 10) });
    }
    setSubmitting(false);
    setShowForm(false);
  }

  async function handleDelete(role: CustomRole) {
    if (!confirm(`هل تريد حذف الدور "${role.name}"؟ أي حساب مرتبط به سيفقد كل صلاحياته فورًا.`)) return;
    await deleteRole(role.id);
  }

  return (
    <DashboardShell allow={["admin"]} title="الصلاحيات">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>الأدوار المخصصة</CardTitle>
              <CardSubtitle>
                {roles.length} دور — إضافة إلى الأدوار السبعة الثابتة في النظام، بصلاحيات تحددها بنفسك لكل صفحة
              </CardSubtitle>
            </div>
            <Button size="sm" onClick={startCreate}>
              <Plus size={15} /> دور جديد
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th></Th>
                  <Th>اسم الدور</Th>
                  <Th>الصفحات الممنوحة</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {roles.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد أدوار مخصصة بعد</Td>
                  </Tr>
                )}
                {roles.map((r) => {
                  const isOpen = editingId === r.id && showForm;
                  const grantedLabels = RESOURCES.filter((res) => r.permissions?.[res]?.read).map(
                    (res) => customResourceNav[res].label
                  );
                  return (
                    <Fragment key={r.id}>
                      <Tr className="cursor-pointer" onClick={() => (isOpen ? setShowForm(false) : startEdit(r))}>
                        <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                        <Td className="font-semibold">{r.name}</Td>
                        <Td className="text-muted">{grantedLabels.length > 0 ? grantedLabels.join("، ") : "بدون صلاحيات بعد"}</Td>
                        <Td>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDelete(r);
                            }}
                            className="text-muted hover:text-danger-500"
                            title="حذف الدور"
                          >
                            <Trash2 size={15} />
                          </button>
                        </Td>
                      </Tr>
                      {isOpen && (
                        <Tr className="bg-background">
                          <Td colSpan={4} className="py-4 whitespace-normal align-top">
                            {renderForm()}
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

        {showForm && !editingId && (
          <Card>
            <CardHeader>
              <CardTitle>دور جديد</CardTitle>
            </CardHeader>
            <CardContent>{renderForm()}</CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );

  function renderForm() {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
        <div>
          <Label htmlFor="rname">اسم الدور</Label>
          <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مشرف مبيعات" required />
        </div>
        <div>
          <Label>الصلاحيات لكل صفحة</Label>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background text-xs text-muted">
                  <th className="text-start font-semibold py-2 px-3">الصفحة</th>
                  <th className="text-center font-semibold py-2 px-3">عرض</th>
                  <th className="text-center font-semibold py-2 px-3">تعديل</th>
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map((resource) => (
                  <tr key={resource} className="border-t border-border">
                    <td className="py-2 px-3 font-medium">{customResourceNav[resource].label}</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!permissions[resource]?.read}
                        onChange={() => toggle(resource, "read")}
                        className="h-4 w-4 rounded border-border accent-brand-600"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!permissions[resource]?.write}
                        onChange={() => toggle(resource, "write")}
                        className="h-4 w-4 rounded border-border accent-brand-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? "جارِ الحفظ..." : "حفظ الدور"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="self-start">
            إلغاء
          </Button>
        </div>
      </form>
    );
  }
}
