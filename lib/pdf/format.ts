// The UI's currency() (lib/mock-data.ts) uses the ﷼ ligature (U+FDFC),
// which isn't in the Cairo TTF's glyph set — browsers fall back to another
// installed font for it, but the PDF renderer only has the one embedded
// font, so it rendered as a missing-glyph box. Spelling it out as "ر.س"
// avoids the ligature entirely using ordinary Arabic letters Cairo covers.
export function pdfCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value) + " ر.س";
}
