import { currency } from "@/lib/mock-data";

// Amounts are isolated left-to-right so the sign always sits on the digits'
// leading edge, whatever the surrounding RTL text does. Negatives use a true
// minus (U+2212), not a hyphen.
export function Money({ value, negative = false, className }: { value: number; negative?: boolean; className?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {negative ? "−" : ""}
      {currency(Math.abs(value))}
    </bdi>
  );
}
