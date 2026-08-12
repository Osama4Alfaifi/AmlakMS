import type { Contract, Property, Tenant } from "@/lib/types";

export interface AppNotification {
  id: string;
  type: "عقد قرب الانتهاء" | "دفعة مستحقة قريبًا" | "انتهاء إدارة عقار قريبًا" | "انتهاء هوية مستأجر قريبًا";
  message: string;
  date: string;
  contractId?: string;
  propertyId?: string;
}

const DAY_MS = 86400000;

// Computed live from current data on every render — not stored, so it
// needs no scheduled/cron function to stay accurate (which would require
// Cloud Functions and another Blaze-plan dependency).
// withinDays.contract also governs the management-agreement and tenant-ID
// expiry checks below — see AppSettings.notificationLeadDays, which callers
// pass in here instead of the 30-day default.
export function computeNotifications(
  contracts: Contract[],
  properties: Property[],
  tenants: Tenant[] = [],
  withinDays: { contract: number; payment: number } = { contract: 30, payment: 14 }
): AppNotification[] {
  const propertyTitleById = new Map(properties.map((p) => [p.id, p.title]));
  const tenantById = new Map(tenants.map((t) => [t.id, t]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = (dateStr: string) => Math.round((new Date(`${dateStr}T00:00:00`).getTime() - today.getTime()) / DAY_MS);

  const notifications: AppNotification[] = [];

  contracts.forEach((c) => {
    const propertyTitle = propertyTitleById.get(c.propertyId) ?? c.propertyId;

    if (c.status === "نشط") {
      const daysLeft = daysUntil(c.endDate);
      if (daysLeft >= 0 && daysLeft <= withinDays.contract) {
        notifications.push({
          id: `contract-${c.id}`,
          type: "عقد قرب الانتهاء",
          message: `عقد ${propertyTitle} ينتهي خلال ${daysLeft} يوم`,
          date: c.endDate,
          contractId: c.id,
        });
      }

      const tenant = tenantById.get(c.tenantId);
      if (tenant?.idExpiryDate) {
        const idDaysLeft = daysUntil(tenant.idExpiryDate);
        if (idDaysLeft >= 0 && idDaysLeft <= withinDays.contract) {
          notifications.push({
            id: `tenant-id-${tenant.id}`,
            type: "انتهاء هوية مستأجر قريبًا",
            message: `هوية/إقامة ${tenant.name} تنتهي خلال ${idDaysLeft} يوم`,
            date: tenant.idExpiryDate,
            contractId: c.id,
          });
        }
      }
    }

    (c.payments ?? []).forEach((p) => {
      if (p.status !== "مستحقة") return;
      const daysLeft = daysUntil(p.dueDate);
      if (daysLeft <= withinDays.payment) {
        notifications.push({
          id: `payment-${c.id}-${p.id}`,
          type: "دفعة مستحقة قريبًا",
          message: `دفعة عقد ${propertyTitle} بقيمة ${p.amount.toLocaleString("ar-SA")} ﷼ ${
            daysLeft < 0 ? "متأخرة" : `مستحقة خلال ${daysLeft} يوم`
          }`,
          date: p.dueDate,
          contractId: c.id,
        });
      }
    });
  });

  properties.forEach((p) => {
    if (!p.managementEndDate) return;
    const daysLeft = daysUntil(p.managementEndDate);
    if (daysLeft >= 0 && daysLeft <= withinDays.contract) {
      notifications.push({
        id: `mgmt-${p.id}`,
        type: "انتهاء إدارة عقار قريبًا",
        message: `عقد إدارة عقار ${p.title} ينتهي خلال ${daysLeft} يوم`,
        date: p.managementEndDate,
        propertyId: p.id,
      });
    }
  });

  return notifications.sort((a, b) => a.date.localeCompare(b.date));
}
