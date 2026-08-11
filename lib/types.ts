export type Role = "admin" | "owner" | "tenant" | "technician";

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
