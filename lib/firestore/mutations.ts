"use client";

import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import { generatePaymentSchedule } from "@/lib/contracts/schedule";
import type {
  AuditAction,
  Building,
  Contract,
  ContractPayment,
  DocumentLink,
  Expense,
  ExpenseStatus,
  LeadStage,
  MaintenanceRequest,
  MaintenanceStatus,
  Quote,
  SupportTicket,
  Tenant,
  TicketStatus,
  Unit,
  Vendor,
  Viewing,
  ViewingStatus,
  Voucher,
} from "@/lib/types";

// Records who did what for the admin-only audit log (app/admin/audit-log).
// Fire-and-forget from the caller's perspective — a logging failure must
// never block the primary write it's describing, so callers don't await
// rejections from this; it resolves once the log entry lands or logs its
// own error to the console.
async function logAudit(entityType: string, entityId: string, action: AuditAction, label?: string) {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return;
  try {
    await addDoc(collection(getDb(), "auditLogs"), {
      actorUid: uid,
      action,
      entityType,
      entityId,
      label: label ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}

export async function createQuote(quote: Omit<Quote, "id">) {
  const ref = await addDoc(collection(getDb(), "quotes"), quote);
  void logAudit("quotes", ref.id, "create", quote.number);
  return ref.id;
}

// Admin-only (see firestore.rules — writes to expenses go through the
// admin wildcard rule; there's no client-side create path for other roles).
export async function createExpense(expense: Omit<Expense, "id">) {
  const ref = await addDoc(collection(getDb(), "expenses"), expense);
  void logAudit("expenses", ref.id, "create", expense.category);
  return ref.id;
}

// Accountant/admin only (see firestore.rules) — e.g. approving payment
// (معلقة → مدفوعة).
export async function updateExpenseStatus(id: string, status: ExpenseStatus) {
  await updateDoc(doc(getDb(), "expenses", id), { status });
  void logAudit("expenses", id, "update", `status → ${status}`);
}

export async function createSupportTicket(ticket: Omit<SupportTicket, "id">) {
  const ref = await addDoc(collection(getDb(), "supportTickets"), ticket);
  void logAudit("supportTickets", ref.id, "create", ticket.subject);
  return ref.id;
}

export async function updateSupportTicketStatus(id: string, status: TicketStatus) {
  await updateDoc(doc(getDb(), "supportTickets", id), { status });
  void logAudit("supportTickets", id, "update", `status → ${status}`);
}

export async function createMaintenanceRequest(request: Omit<MaintenanceRequest, "id">) {
  const ref = await addDoc(collection(getDb(), "maintenanceRequests"), request);
  void logAudit("maintenanceRequests", ref.id, "create", request.title);
  return ref.id;
}

export async function updateMaintenanceRequest(
  id: string,
  patch: Partial<Pick<MaintenanceRequest, "status" | "technicianId" | "vendorId" | "scheduledDate">>
) {
  await updateDoc(doc(getDb(), "maintenanceRequests", id), patch);
  void logAudit("maintenanceRequests", id, "update");
}

export async function claimMaintenanceRequest(id: string, technicianId: string) {
  await updateMaintenanceRequest(id, { technicianId, status: "قيد التنفيذ" as MaintenanceStatus });
}

export async function assignVendorToMaintenanceRequest(id: string, vendorId: string) {
  await updateMaintenanceRequest(id, { vendorId });
}

// Admin-only writes (buildings/units/vendors are reference data, same
// pattern as properties — see firestore.rules).
export async function createBuilding(building: Omit<Building, "id">) {
  const ref = await addDoc(collection(getDb(), "buildings"), building);
  void logAudit("buildings", ref.id, "create", building.name);
  return ref.id;
}

export async function createUnit(unit: Omit<Unit, "id">) {
  const ref = await addDoc(collection(getDb(), "units"), unit);
  void logAudit("units", ref.id, "create", unit.unitNumber);
  return ref.id;
}

export async function createVendor(vendor: Omit<Vendor, "id">) {
  const ref = await addDoc(collection(getDb(), "vendors"), vendor);
  void logAudit("vendors", ref.id, "create", vendor.name);
  return ref.id;
}

// CRM: lead stage lives on the existing Client doc (type === "عميل محتمل").
export async function updateLeadStage(clientId: string, stage: LeadStage) {
  await updateDoc(doc(getDb(), "clients", clientId), { stage });
  void logAudit("clients", clientId, "update", `stage → ${stage}`);
}

export async function createViewing(viewing: Omit<Viewing, "id">) {
  const ref = await addDoc(collection(getDb(), "viewings"), viewing);
  void logAudit("viewings", ref.id, "create");
  return ref.id;
}

export async function updateViewingStatus(id: string, status: ViewingStatus) {
  await updateDoc(doc(getDb(), "viewings", id), { status });
  void logAudit("viewings", id, "update", `status → ${status}`);
}

export async function createDocumentLink(documentLink: Omit<DocumentLink, "id">) {
  const ref = await addDoc(collection(getDb(), "documentLinks"), documentLink);
  void logAudit("documentLinks", ref.id, "create", documentLink.title);
  return ref.id;
}

// Accountant/admin only (see firestore.rules). The payment schedule is
// generated here, not passed in, so every creation path gets it — see
// lib/contracts/schedule.ts.
// payments: pass the real schedule extracted from an Ejar contract file
// when available (it can be non-uniform — see lib/rega/parseEjarContract);
// omitted, it falls back to generatePaymentSchedule's even split.
export async function createContract(contract: Omit<Contract, "id" | "payments">, payments?: ContractPayment[]) {
  const finalPayments = payments ?? generatePaymentSchedule(contract.startDate, contract.endDate, contract.value, contract.paymentCycle);
  const ref = await addDoc(collection(getDb(), "contracts"), { ...contract, payments: finalPayments });
  void logAudit("contracts", ref.id, "create", `عقد جديد بقيمة ${contract.value.toLocaleString("ar-SA")} ﷼`);
  return ref.id;
}

// Caller passes the full updated array (it already has the current one via
// useContracts/useFirestoreDoc) — avoids an extra read-before-write round
// trip, same as how updateMaintenanceRequest takes a ready-made patch.
export async function updateContractPayments(contractId: string, payments: ContractPayment[], label?: string) {
  await updateDoc(doc(getDb(), "contracts", contractId), { payments });
  void logAudit("contracts", contractId, "update", label);
}

export async function endContract(contractId: string) {
  await updateDoc(doc(getDb(), "contracts", contractId), { status: "منتهي" });
  void logAudit("contracts", contractId, "update", "تم إنهاء العقد");
}

export async function createTenant(tenant: Omit<Tenant, "id">) {
  const ref = await addDoc(collection(getDb(), "tenants"), tenant);
  void logAudit("tenants", ref.id, "create", tenant.name);
  return ref.id;
}

// Back-fills a newly created tenant's contractId once the contract itself
// exists (contract.tenantId and tenant.contractId reference each other, so
// one side has to be written second — see the contract-creation flow in
// app/admin/contracts).
export async function updateTenantContract(tenantId: string, contractId: string) {
  await updateDoc(doc(getDb(), "tenants", tenantId), { contractId });
}

export async function createVoucher(voucher: Omit<Voucher, "id">) {
  const ref = await addDoc(collection(getDb(), "vouchers"), voucher);
  void logAudit("vouchers", ref.id, "create", `سند ${voucher.type} رقم ${voucher.number}`);
  return ref.id;
}
