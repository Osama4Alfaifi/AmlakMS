import { invoiceIds } from "@/lib/demo/static-params";
import InvoicePrintPage from "./PrintView";

// Server wrapper so the static demo export can prerender this dynamic route
// (a "use client" page can't export generateStaticParams).
export function generateStaticParams() {
  return invoiceIds();
}

export default function Page() {
  return <InvoicePrintPage />;
}
