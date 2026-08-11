export type Role = "admin" | "owner" | "tenant" | "technician" | "accountant" | "leasingAgent" | "maintenanceStaff";

// linkedId points to the owners/tenants/technicians record this account
// represents (null for admin, who isn't tied to a single record).
export interface SessionUser {
  uid: string;
  role: Role;
  name: string;
  email: string;
  linkedId: string | null;
}

export type PropertyType = "شقة" | "فيلا" | "محل تجاري" | "مكتب" | "أرض" | "استراحة";
export type PropertyStatus = "متاحة" | "مؤجرة" | "مباعة" | "تحت الصيانة";

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  city: string;
  district: string;
  address: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  listingType: "إيجار" | "بيع";
  status: PropertyStatus;
  ownerId: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: string;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  // Fraction of net rental income retained as a management fee when
  // computing the owner statement (e.g. 0.1 = 10%). Defaults to 0.1 in
  // app/owner/page.tsx when not set.
  managementFeeRate?: number;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyId: string;
  contractId: string;
}

export type ContractStatus = "نشط" | "منتهي" | "قيد التجديد";

export interface Contract {
  id: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  type: "إيجار" | "بيع";
  startDate: string;
  endDate: string;
  value: number;
  paymentCycle: "شهري" | "ربع سنوي" | "سنوي";
  status: ContractStatus;
}

export type ClientType = "مالك" | "مستأجر" | "عميل محتمل";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: ClientType;
  joinedAt: string;
  // CRM pipeline fields — only meaningful when type === "عميل محتمل".
  stage?: LeadStage;
  interestedPropertyId?: string;
}

export type InvoiceStatus = "مدفوعة" | "معلقة" | "متأخرة";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  propertyTitle: string;
  items: InvoiceItem[];
  // Residential rentals are VAT-exempt in Saudi Arabia; only commercial
  // rentals carry the 15% VAT — see taxRateForPropertyType() in mock-data.ts.
  taxRate: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export type ExpenseCategory =
  | "صيانة"
  | "كهرباء"
  | "مياه"
  | "تنظيف"
  | "أمن"
  | "تأمين"
  | "رسوم حكومية"
  | "أخرى";
export type ExpenseStatus = "مدفوعة" | "معلقة";

export interface ExpenseItem {
  description: string;
  amount: number;
}

export interface Expense {
  id: string;
  propertyId: string;
  // Denormalized from the property at creation time — same
  // list-provability reason as MaintenanceRequest.ownerId (see
  // firestore.rules): an owner-scoped `list` query needs this field
  // directly on the document, not resolved via a cross-collection get().
  ownerId: string;
  category: ExpenseCategory;
  // What the total is made of (e.g. "دهانات" 100 + "خلاطات" 400 + "شغل يد"
  // 300). `amount` is kept as the sum of items so existing aggregations
  // (KPI totals, owner net income) don't need to recompute it everywhere.
  items: ExpenseItem[];
  amount: number;
  date: string;
  vendorName?: string;
  notes?: string;
  status: ExpenseStatus;
}

export type QuoteStatus = "مسودة" | "مرسل" | "مقبول" | "مرفوض";

export interface Quote {
  id: string;
  number: string;
  clientName: string;
  propertyTitle: string;
  items: InvoiceItem[];
  taxRate: number;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
  notes?: string;
}

export type Priority = "عاجل" | "متوسط" | "منخفض";
export type MaintenanceStatus = "جديد" | "قيد التنفيذ" | "مكتمل";

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  ownerId?: string | null;
  tenantName: string;
  createdByUid?: string;
  technicianId: string | null;
  // External vendor (Vendor.id) a request can be handed off to instead of
  // (or alongside) an internal technician — see app/admin/maintenance.
  vendorId?: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  createdAt: string;
  scheduledDate?: string;
}

export type TechnicianSpecialty = "كهرباء" | "سباكة" | "تكييف" | "صيانة عامة";

export interface Technician {
  id: string;
  name: string;
  specialty: TechnicianSpecialty;
  phone: string;
  rating: number;
}

// External maintenance/service company — same shape as Technician, but not
// an in-house staff member, so it isn't tied to a Firebase Auth account.
export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

// A building groups multiple rentable/sellable units under one address —
// additive to the existing single-level `Property` catalog, which continues
// to represent standalone listings unchanged.
export interface Building {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  ownerId: string;
  notes?: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  // Denormalized from the building — same list-provability reason as
  // Expense.ownerId (see firestore.rules).
  ownerId: string;
  unitNumber: string;
  floor: number;
  type: PropertyType;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  listingType: "إيجار" | "بيع";
  status: PropertyStatus;
  createdAt: string;
}

// CRM pipeline stage for Client records of type "عميل محتمل" — see
// app/admin/leads/page.tsx.
export type LeadStage = "جديد" | "تواصل أولي" | "معاينة مجدولة" | "عرض مقدم" | "تم التحويل لمستأجر" | "مرفوض";

export type ViewingStatus = "مجدولة" | "مكتملة" | "ملغاة";

export interface Viewing {
  id: string;
  leadId: string;
  propertyId: string;
  scheduledAt: string;
  status: ViewingStatus;
  notes?: string;
  createdAt: string;
}

// Link-based document catalog — stores metadata + an externally-hosted URL
// (Google Drive, email attachment, etc.) rather than an uploaded file. Real
// in-app file upload needs Firebase Storage, which requires upgrading the
// Firebase project to the Blaze plan; deferred until that's decided (see
// the same call on expense receipts).
export type DocumentCategory = "عقد" | "فاتورة" | "هوية" | "صك ملكية" | "تأمين" | "أخرى";
export type DocumentEntityType = "عقار" | "عقد" | "مالك" | "مستأجر" | "مبنى";

export interface DocumentLink {
  id: string;
  title: string;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  entityLabel: string;
  url: string;
  notes?: string;
  createdAt: string;
}

export type AuditAction = "create" | "update";

export interface AuditLog {
  id: string;
  actorUid: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  label?: string;
  timestamp: string;
}

export type TicketCategory = "خدمة العملاء" | "الدعم الفني";
export type TicketStatus = "مفتوحة" | "قيد المعالجة" | "مغلقة";

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  category: TicketCategory;
  from: string;
  createdByUid?: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  description: string;
}

export interface AccountManager {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  color: string;
  bio: string;
}

// Firestore doc at users/{uid} — the source of truth for a signed-in
// account's role and which business record it represents.
export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  email: string;
  linkedId: string | null;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role | "مدير حساب";
  status: "نشط" | "موقوف";
  lastLogin: string;
}
