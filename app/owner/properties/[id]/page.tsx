import { propertyIds } from "@/lib/demo/static-params";
import PropertyView from "./PropertyView";

// Server wrapper so the static demo export can prerender this dynamic route
// (a "use client" page can't export generateStaticParams).
export function generateStaticParams() {
  return propertyIds();
}

export default function Page() {
  return <PropertyView />;
}
