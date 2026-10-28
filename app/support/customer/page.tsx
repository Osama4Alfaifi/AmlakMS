"use client";

import { TicketBoard } from "@/components/support/TicketBoard";

export default function CustomerServicePage() {
  return <TicketBoard category="خدمة العملاء" allow={["admin", "owner", "tenant", "technician", "accountant", "leasingAgent", "maintenanceStaff", "custom"]} title="خدمة العملاء" />;
}
