import type { ContractPayment, PaymentCycle } from "@/lib/types";

const CYCLE_MONTHS: Record<PaymentCycle, number> = {
  "شهري": 1,
  "ربع سنوي": 3,
  "ثلث سنوي": 4,
  "نصف سنوي": 6,
  "سنوي": 12,
  // Everything up front: the cycle is longer than any contract, so the
  // instalment count rounds down to exactly one payment on the start date.
  "دفعة واحدة": 100000,
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
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
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
// graceMonths: optional rent-free period before the first installment falls
// due — shifts the whole schedule's start later by that many months without
// changing the contract's own startDate/endDate.
export function generatePaymentSchedule(
  startDate: string,
  endDate: string,
  totalValue: number,
  cycle: PaymentCycle,
  paymentDay?: number,
  graceMonths?: number
): ContractPayment[] {
  const cycleMonths = CYCLE_MONTHS[cycle];
  const scheduleStart = graceMonths ? addMonths(startDate, graceMonths) : startDate;
  const totalMonths = monthsBetween(scheduleStart, endDate);
  const count = Math.max(1, Math.round(totalMonths / cycleMonths));
  const baseAmount = Math.floor(totalValue / count);
  const remainder = totalValue - baseAmount * count;

  return Array.from({ length: count }, (_, i) => {
    const dueDate = addMonths(scheduleStart, i * cycleMonths);
    return {
      id: String(i + 1),
      dueDate: paymentDay ? withDay(dueDate, paymentDay) : dueDate,
      amount: i === count - 1 ? baseAmount + remainder : baseAmount,
      status: "مستحقة" as const,
    };
  });
}

export interface DurationYMD {
  years: number;
  months: number;
  days: number;
}

// Calendar Y/M/D difference between two dates (from <= to) — used both for
// a contract's stated duration and for how much of it is left. Not simple
// day-division: a "1 year" contract should read back as "سنة" even though
// the exact day count varies with leap years.
function diffYMD(from: string, to: string): DurationYMD {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let years = ty - fy;
  let months = tm - fm;
  let days = td - fd;
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

// A contract's real span: endDate is the day BEFORE the duration's
// anniversary (see computeEndDateFromDuration), so the true length is
// measured against the anniversary itself (endDate + 1 day) — otherwise a
// clean "1 year" contract would read back as "11 months and 30 days".
export function contractDuration(startDate: string, endDate: string): DurationYMD {
  return diffYMD(startDate, addDays(endDate, 1));
}

export interface RemainingDuration extends DurationYMD {
  expired: boolean;
}

// How much of a contract's term is left counting from today — or, once
// past endDate, how long ago it lapsed. Same anniversary adjustment as
// contractDuration above.
export function remainingFromToday(endDate: string): RemainingDuration {
  const today = new Date().toISOString().slice(0, 10);
  const anniversary = addDays(endDate, 1);
  if (today >= anniversary) {
    return { ...diffYMD(anniversary, today), expired: true };
  }
  return { ...diffYMD(today, anniversary), expired: false };
}

// Simple singular/plural pairing (no dual form) — matches this codebase's
// existing "دفعة"/"دفعات" style rather than full Arabic numeral agreement.
const UNIT_LABELS: Record<keyof DurationYMD, [string, string]> = {
  years: ["سنة", "سنوات"],
  months: ["شهر", "أشهر"],
  days: ["يوم", "أيام"],
};

export function formatDurationYMD(d: DurationYMD): string {
  const parts = (["years", "months", "days"] as const)
    .filter((unit) => d[unit] > 0)
    .map((unit) => `${d[unit]} ${d[unit] === 1 ? UNIT_LABELS[unit][0] : UNIT_LABELS[unit][1]}`);
  return parts.length > 0 ? parts.join(" و") : "أقل من يوم";
}
