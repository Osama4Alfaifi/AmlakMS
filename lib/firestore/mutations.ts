"use client";

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { MaintenanceRequest, MaintenanceStatus, Quote, SupportTicket, TicketStatus } from "@/lib/types";

export async function createQuote(quote: Omit<Quote, "id">) {
  const ref = await addDoc(collection(getDb(), "quotes"), quote);
  return ref.id;
}

export async function createSupportTicket(ticket: Omit<SupportTicket, "id">) {
  const ref = await addDoc(collection(getDb(), "supportTickets"), ticket);
  return ref.id;
}

export async function updateSupportTicketStatus(id: string, status: TicketStatus) {
  await updateDoc(doc(getDb(), "supportTickets", id), { status });
}

export async function createMaintenanceRequest(request: Omit<MaintenanceRequest, "id">) {
  const ref = await addDoc(collection(getDb(), "maintenanceRequests"), request);
  return ref.id;
}

export async function updateMaintenanceRequest(
  id: string,
  patch: Partial<Pick<MaintenanceRequest, "status" | "technicianId" | "scheduledDate">>
) {
  await updateDoc(doc(getDb(), "maintenanceRequests", id), patch);
}

export async function claimMaintenanceRequest(id: string, technicianId: string) {
  await updateMaintenanceRequest(id, { technicianId, status: "قيد التنفيذ" as MaintenanceStatus });
}
