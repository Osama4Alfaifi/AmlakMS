import type { Contract, Property } from "@/lib/types";

export interface AppNotification {
  id: string;
  type: "عقد قرب الانتهاء" | "دفعة مستحقة قريبًا";
  message: string;
  date: string;
  contractId: string;
}

const DAY_MS = 86400000;

// Computed live from current data on every render — not stored, so it
// needs no scheduled/cron function to stay accurate (which would require
// Cloud Functions and another Blaze-plan dependency).
export function computeNotifications(
  contracts: Contract[],
  properties: Property[],
  withinDays: { contract: number; payment: number } = { contract: 30, payment: 14 }
): AppNotification[] {
  const propertyTitleById = new Map(properties.map((p) => [p.id, p.title]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications: AppNotification[] = [];

  contracts.forEach((c) => {
    const propertyTitle = propertyTitleById.get(c.propertyId) ?? c.propertyId;

    if (c.status === "نشط") {
      const daysLeft = Math.round((new Date(`${c.endDate}T00:00:00`).getTime() - today.getTime()) / DAY_MS);
      if (daysLeft >= 0 && daysLeft <= withinDays.contract) {
        notifications.push({
          id: `contract-${c.id}`,
          type: "عقد قرب الانتهاء",
          message: `عقد ${propertyTitle} ينتهي خلال ${daysLeft} يوم`,
          date: c.endDate,
          contractId: c.id,
        });
      }
    }

    (c.payments ?? []).forEach((p) => {
      if (p.status !== "مستحقة") return;
      const daysLeft = Math.round((new Date(`${p.dueDate}T00:00:00`).getTime() - today.getTime()) / DAY_MS);
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

  return notifications.sort((a, b) => a.date.localeCompare(b.date));
}
