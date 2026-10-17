import { voucherIds } from "@/lib/demo/static-params";
import VoucherPrintPage from "./PrintView";

// Server wrapper so the static demo export can prerender this dynamic route
// (a "use client" page can't export generateStaticParams).
export function generateStaticParams() {
  return voucherIds();
}

export default function Page() {
  return <VoucherPrintPage />;
}
