// generateStaticParams helper for the printable [id] routes. A static export
// can only serve ids that were prerendered, so the GitHub Pages demo covers
// the seeded docs plus a pool of ids that newly created docs are assigned
// from (see PRINTABLE_COLLECTIONS in ./store.ts). Harmless in the normal
// build, where unknown ids are still rendered on demand.
import { invoices, properties, quotes } from "../mock-data";
import { PRINTABLE_ID_POOL_SIZE, printablePoolId } from "./store";

const pool = Array.from({ length: PRINTABLE_ID_POOL_SIZE }, (_, i) => printablePoolId(i + 1));

export const quoteIds = () => [...quotes.map((q) => q.id), ...pool].map((id) => ({ id }));
export const invoiceIds = () => [...invoices.map((i) => i.id), ...pool].map((id) => ({ id }));
export const propertyIds = () => properties.map((p) => ({ id: p.id }));
export const voucherIds = () => pool.map((id) => ({ id }));
