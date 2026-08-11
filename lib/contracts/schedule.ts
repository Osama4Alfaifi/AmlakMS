import type { ContractPayment, PaymentCycle } from "@/lib/types";

const CYCLE_MONTHS: Record<PaymentCycle, number> = {
  "شهري": 1,
  "ربع سنوي": 3,
  "نصف سنوي": 6,
  "سنوي": 12,
};

// Pure Y/M/D arithmetic via Date.UTC — parsing "YYYY-MM-DD" as local time
// and converting back with toISOString() drifts the date by one day
// whenever the local timezone is ahead of UTC (local midnight becomes the
// previous day in UTC), which is exactly what happened here on first pass.
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  return Math.max(1, (ey - sy) * 12 + (em - sm));
}

// A 1-year contract paid semi-annually becomes exactly 2 installments: this
// divides the contract's duration by its payment cycle length, then splits
// the total value evenly across that many dated installments (any rounding
// remainder is absorbed into the last one so the sum always matches).
export function generatePaymentSchedule(
  startDate: string,
  endDate: string,
  totalValue: number,
  cycle: PaymentCycle
): ContractPayment[] {
  const cycleMonths = CYCLE_MONTHS[cycle];
  const totalMonths = monthsBetween(startDate, endDate);
  const count = Math.max(1, Math.round(totalMonths / cycleMonths));
  const baseAmount = Math.floor(totalValue / count);
  const remainder = totalValue - baseAmount * count;

  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    dueDate: addMonths(startDate, i * cycleMonths),
    amount: i === count - 1 ? baseAmount + remainder : baseAmount,
    status: "مستحقة" as const,
  }));
}
