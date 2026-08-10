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
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
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
