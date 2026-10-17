import { quoteIds } from "@/lib/demo/static-params";
import QuotePrintPage from "./PrintView";

// Server wrapper so the static demo export can prerender this dynamic route
// (a "use client" page can't export generateStaticParams).
export function generateStaticParams() {
  return quoteIds();
}

export default function Page() {
  return <QuotePrintPage />;
}
