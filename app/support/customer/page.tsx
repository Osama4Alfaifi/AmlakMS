"use client";

import { TicketBoard } from "@/components/support/TicketBoard";

export default function CustomerServicePage() {
  return <TicketBoard category="خدمة العملاء" allow={["admin", "owner", "tenant"]} title="خدمة العملاء" />;
}
