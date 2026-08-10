"use client";

import { TicketBoard } from "@/components/support/TicketBoard";

export default function TechnicalSupportPage() {
  return <TicketBoard category="الدعم الفني" allow={["admin", "technician"]} title="الدعم الفني" />;
}
