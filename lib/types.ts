// "custom" is additive: the 7 original roles keep their fixed, hardcoded
// permissions in firestore.rules completely unchanged. An account with role
// "custom" instead derives 100% of its access from the CustomRole document
// its customRoleId points to (see PermissionResource/CustomRole below,
// app/admin/roles, and the customCan() rule helper in firestore.rules) —
// this keeps the dynamic-permissions engine opt-in and isolated from the
// app's existing, already-verified security boundaries.
export type Role = "admin" | "owner" | "tenant" | "technician" | "accountant" | "leasingAgent" | "maintenanceStaff" | "custom";

// linkedId points to the owners/tenants/technicians record this account
// represents (null for admin, who isn't tied to a single record).
// ownerIds is the accountant-only equivalent for a many-to-many link — one
// accountant can be assigned several owners (set via app/admin/users),
// unlike linkedId's single record. Empty/absent for every other role.
export interface SessionUser {
  uid: string;
  role: Role;
  name: string;
  email: string;
  linkedId: string | null;
  ownerIds?: string[];
  // Only set (and meaningful) when role === "custom" — see CustomRole.
  customRoleId?: string | null;
}

// The resources a custom role can be granted access to — deliberately a
// fixed, small set matching the app's real admin-delegation surface (not
// every collection in the database) so the permission matrix stays legible
// and every entry maps to a real nav item — see customResourceNav in
// components/layout/nav-config.ts.
export type PermissionResource = "properties" | "contracts" | "expenses" | "vouchers" | "maintenanceRequests" | "clients";

export interface RolePermission {
  read?: boolean;
  write?: boolean;
}

// Firestore doc at roles/{id} — an admin-defined custom role and its
// permission matrix. Enforced live in firestore.rules via customCan(), not
// just in the UI. See app/admin/roles.
export interface CustomRole {
  id: string;
  name: string;
  permissions: Partial<Record<PermissionResource, RolePermission>>;
  createdAt: string;
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
  listingType: "إيجار" | "بيع" | "استثمار";
  status: PropertyStatus;
  ownerId: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: string;
  // تاريخ انتهاء تفويض الشركة بإدارة العقار من المالك — منفصل تمامًا عن
  // تاريخ انتهاء أي عقد إيجار قائم عليه (Contract.endDate)، انظر
  // computeNotifications في lib/notifications.ts.
  managementEndDate?: string;
  // وسيط خارجي أُنجزت الصفقة عبره (إن وُجد).
  hasBroker?: boolean;
  brokerName?: string;
  brokerPhone?: string;
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
  // Not collected by the "مستأجر جديد" quick-add form (see
  // app/admin/contracts) — still present for tenants that have one
  // (seed data, or a real Firebase Auth login account).
  email?: string;
  idNumber?: string;
  birthDate?: string;
  // تاريخ انتهاء الهوية/الإقامة — يُستخدم لإصدار تنبيه قرب الانتهاء، انظر
  // computeNotifications في lib/notifications.ts.
  idExpiryDate?: string;
  secondaryPhone?: string;
  employer?: string;
  propertyId: string;
  contractId: string;
}

export type ContractStatus = "نشط" | "منتهي" | "قيد التجديد";
export type PaymentCycle = "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي";
export type PaymentStatus = "مستحقة" | "مسددة";

export interface ContractPayment {
  id: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface Contract {
  id: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  type: "إيجار" | "بيع" | "استثمار";
  // تاريخ إبرام العقد — قد يسبق تاريخ بداية سريانه.
  signedAt?: string;
  startDate: string;
  endDate: string;
  value: number;
  paymentCycle: PaymentCycle;
  // يوم استحقاق ثابت من كل شهر (1-31) لكل الدفعات، بمعزل عن يوم بداية العقد
  // نفسه — اختياري، انظر generatePaymentSchedule.
  paymentDay?: number;
  // عدد أشهر السماح قبل استحقاق أول دفعة (إيجار مجاني في بداية العقد) —
  // يُزاح جدول الدفعات بالكامل بهذا القدر، انظر generatePaymentSchedule.
  graceMonths?: number;
  // رسوم شهرية ثابتة للماء/الكهرباء تُضاف كبند منفصل — لا تُحتسب ضمن قيمة
  // العقد (value) أو جدول الدفعات نفسه.
  waterFee?: number;
  electricityFee?: number;
  status: ContractStatus;
  // رابط خارجي لنسخة العقد (Drive وغيره) — لا رفع حقيقي داخل التطبيق؛ نفس نهج DocumentLink.
  documentUrl?: string;
  // رقم سجل العقد في منصة إيجار — يُملأ تلقائيًا عند الاستيراد من ملف Ejar (انظر lib/rega).
  externalContractNo?: string;
  // مُولَّد تلقائيًا عند الإنشاء من (المدة ÷ دورة الدفع) — انظر lib/contracts/schedule.ts.
  payments: ContractPayment[];
}

export type VoucherType = "قبض" | "صرف";
export type VoucherMethod = "نقدًا" | "تحويل بنكي";

export interface Voucher {
  id: string;
  number: string;
  type: VoucherType;
  personName: string;
  amount: number;
  method: VoucherMethod;
  statement: string;
  date: string;
  contractId?: string;
  // Set when issued from a specific installment in a contract's payment
  // schedule (see app/admin/contracts) — paymentNumber is that
  // ContractPayment's id (its sequence number, e.g. "1"), and periodFrom/To
  // is the rental period that installment covers.
  paymentNumber?: string;
  periodFrom?: string;
  periodTo?: string;
  createdAt: string;
  createdByUid?: string;
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
  listingType: "إيجار" | "بيع" | "استثمار";
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

export type AuditAction = "create" | "update" | "delete";

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
  // Accountant-only: the owners this accountant is assigned to (many-to-many
  // — see SessionUser.ownerIds and app/admin/users).
  ownerIds?: string[];
  // Only set (and meaningful) when role === "custom" — see CustomRole.
  customRoleId?: string | null;
}

// Firestore doc at settings/app — single app-wide record (company profile,
// branding, notification lead time, maintenance-mode toggle). Read by any
// signed-in account; only admin writes (see app/admin/settings and
// firestore.rules).
export interface AppSettings {
  id: string;
  companyNameAr?: string;
  companyNameEn?: string;
  email?: string;
  address?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  bankName?: string;
  accountNumber?: string;
  taxNumber?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  crNumber?: string;
  logoUrl?: string;
  faviconUrl?: string;
  // وضع الصيانة — يمنع كل الأدوار غير الإدمن من الوصول للوحاتهم (انظر
  // components/layout/DashboardShell.tsx).
  siteClosed?: boolean;
  // عدد الأيام قبل الاستحقاق الذي يبدأ عنده ظهور تنبيهات "قرب الانتهاء" —
  // يحل محل withinDays.contract الثابت افتراضيًا في computeNotifications.
  notificationLeadDays?: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role | "مدير حساب";
  status: "نشط" | "موقوف";
  lastLogin: string;
}
