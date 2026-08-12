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

// REGA/Ejar convention: a contract's end date is the day BEFORE the
// anniversary of its duration — a 1-year contract starting 2026-08-12 ends
// 2027-08-11, not 2027-08-12 — see the duration calculator in
// app/admin/contracts.
export function computeEndDateFromDuration(startDate: string, years: number, months: number, days: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const anniversary = new Date(Date.UTC(y, m - 1 + years * 12 + months, d + days));
  anniversary.setUTCDate(anniversary.getUTCDate() - 1);
  return anniversary.toISOString().slice(0, 10);
}

// Same Date.UTC-based arithmetic as the rest of this file — see the note
// on addMonths above for why plain Date parsing/toISOString isn't safe.
export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

// Overrides the day-of-month on an already-computed due date — lets a
// contract's installments fall on a fixed day (e.g. always the 1st)
// regardless of which day the contract itself started on.
function withDay(dateStr: string, day: number): string {
  const [y, m] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toISOString().slice(0, 10);
}

// A 1-year contract paid semi-annually becomes exactly 2 installments: this
// divides the contract's duration by its payment cycle length, then splits
// the total value evenly across that many dated installments (any rounding
// remainder is absorbed into the last one so the sum always matches).
// paymentDay: optional fixed day-of-month for every installment, independent
// of startDate's own day (see withDay above).
export function generatePaymentSchedule(
  startDate: string,
  endDate: string,
  totalValue: number,
  cycle: PaymentCycle,
  paymentDay?: number
): ContractPayment[] {
  const cycleMonths = CYCLE_MONTHS[cycle];
  const totalMonths = monthsBetween(startDate, endDate);
  const count = Math.max(1, Math.round(totalMonths / cycleMonths));
  const baseAmount = Math.floor(totalValue / count);
  const remainder = totalValue - baseAmount * count;

  return Array.from({ length: count }, (_, i) => {
    const dueDate = addMonths(startDate, i * cycleMonths);
    return {
      id: String(i + 1),
      dueDate: paymentDay ? withDay(dueDate, paymentDay) : dueDate,
      amount: i === count - 1 ? baseAmount + remainder : baseAmount,
      status: "مستحقة" as const,
    };
  });
}
