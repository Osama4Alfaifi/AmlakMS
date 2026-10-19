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

// Kept additive — existing seeded properties use "شقة"/"محل تجاري"/etc.
// already, and Unit now has its own much finer-grained UnitType below, so
// these two enums don't need to stay in lockstep.
export type PropertyType =
  | "شقة"
  | "فيلا"
  | "محل تجاري"
  | "مكتب"
  | "أرض"
  | "استراحة"
  | "غرفة عزاب"
  | "عمارة"
  | "مجمع تجاري مفتوح"
  | "مجمع تجاري مغلق"
  | "برج"
  | "أخرى";
export type PropertyStatus = "متاحة" | "مؤجرة" | "مباعة" | "تحت الصيانة";

// Who's billed for a utility meter's consumption — the owner (المالك) or the
// tenant (المستأجر) currently occupying the listing.
export type MeterBilledTo = "المالك" | "المستأجر";

// Additional owner captured at intake for contact purposes only (no
// ownership-percentage/financial-split logic) — see app/admin/properties/new.
export interface CoOwnerContact {
  name: string;
  idNumber?: string;
  birthDate?: string;
  phone?: string;
}

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
  // Captured by the leasing-agent intake wizard (app/admin/properties/new) —
  // optional everywhere else, since the plain admin form doesn't collect them.
  deedType?: "إلكتروني" | "ورقي" | "عقد إيجار" | "سجل عقاري";
  deedIssueDate?: string;
  region?: string;
  street?: string;
  buildingNumber?: string;
  subNumber?: string;
  postalCode?: string;
  propertyNumber?: string;
  usage?: "سكن عائلات" | "سكن أفراد" | "تجاري" | "سكني-تجاري" | "سكن جماعي";
  coOwners?: CoOwnerContact[];
  // Utility meters — only meaningful when the property has no units (a
  // standalone listing); when it branches into units (see Unit below), each
  // unit carries its own meters instead.
  electricityMeterNumber?: string;
  electricityMeterBilledTo?: MeterBilledTo;
  waterMeterNumber?: string;
  waterMeterBilledTo?: MeterBilledTo;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  // Not always on hand at intake time (see app/admin/properties/new) — the
  // demo-persona seed data always sets it, real agent-created owners may not.
  email?: string;
  joinedAt: string;
  // Fraction of net rental income retained as a management fee when
  // computing the owner statement (e.g. 0.1 = 10%). Defaults to 0.1 in
  // app/owner/page.tsx when not set.
  managementFeeRate?: number;
  idNumber?: string;
  birthDate?: string;
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
  // Set when propertyId points at a property that's split into units (see
  // Unit below) — identifies which specific unit this tenant occupies.
  // Undefined for a standalone (non-branched) property.
  unitId?: string;
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
  paymentSource?: "إيجار" | "تحويل بنكي" | "كاش" | "إيصال";
  bankName?: string;
  reference?: string;
  proofUrl?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  note?: string;
}

export interface Contract {
  id: string;
  propertyId: string;
  // Set when propertyId points at a property that's split into units (see
  // Unit below) — this lease is for one specific unit, not the whole
  // property. Undefined for a standalone (non-branched) property.
  unitId?: string;
  ownerId: string;
  tenantId: string;
  type: "إيجار" | "بيع" | "استثمار";
  // For leases: residential or commercial (chosen first in the leasing agent's
  // new-lease flow). Optional because older contracts predate it.
  usage?: "سكني" | "تجاري";
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
  // Denormalized so firestore.rules can scope reads without a
  // cross-collection get() — same reason as Expense.ownerId. Undefined only
  // for legacy/unlinked invoices, which then only admin can read.
  ownerId?: string;
  tenantId?: string;
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
  // Denormalized to the creating owner (undefined for an admin-authored
  // quote not tied to a specific owner's property/listing) — see
  // firestore.rules, which uses this to scope an owner's reads to their own
  // quotes instead of the whole collection.
  ownerId?: string;
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

// Much finer-grained than PropertyType on purpose — a unit is a specific
// space within a property, not the property's own classification. Kept as
// its own enum rather than folded into PropertyType (see the note there).
// "غرفة عزاب" appended at the end so the units seeded earlier this session
// stay valid. Exported as a const array (not just a union) so pages don't
// each need to retype this 35-item list — see app/admin/properties/page.tsx
// and app/admin/properties/new.
export const UNIT_TYPES = [
  "كشك",
  "محل",
  "ورشة",
  "أرض",
  "أرض مسورة",
  "محطة",
  "مكتب",
  "مستودع",
  "معرض",
  "صراف",
  "سينما",
  "محطة كهرباء",
  "برج اتصالات",
  "فندق",
  "مواقف سيارات",
  "مجمع تجاري مفتوح (بلازا)",
  "دور",
  "شقة",
  "فيلا",
  "عمارة",
  "برج",
  "شقة ثنائية الدور (دوبلكس)",
  "شقة صغيرة (استديو)",
  "شقة ملحق",
  "شقة وملحق علوي",
  "دور وملحق علوي",
  "فيلا سطح",
  "غرفة سائق",
  "استراحة",
  "غرفة بمساحة مشتركة",
  "غرفة فندقية",
  "بيت شعبي",
  "شقة دورين",
  "مجمع تعليمي",
  "مجمع سكني",
  "غرفة عزاب",
] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

// The fixed facility checklist offered when adding a unit — see
// app/admin/properties/new. Stored as free-form strings on Unit.amenities
// rather than a strict type so the list can grow without a schema change.
export const UNIT_AMENITIES = [
  "دورة مياه",
  "غرف نوم",
  "غرفة الخادمة",
  "صالات",
  "مخزن",
  "مطبخ",
  "مجلس",
  "الفناء الخلفي",
  "مكيف سبليت",
  "مكيف مركزي",
  "مكيف شباك",
  "مكيف صحراوي",
] as const;

// A selected amenity plus how many of it the unit has (e.g. 3 غرف نوم) —
// see app/admin/properties/new, where clicking an amenity selects it with
// a default count of 1 and reveals a +/- stepper to adjust it.
export interface UnitAmenity {
  name: string;
  count: number;
}

// A property can optionally branch into units — e.g. a complex with many
// individually-leased rooms/shops, each getting its own Contract/Tenant via
// unitId above, instead of the whole property being one rentable listing.
// A property with no units behaves exactly as before (standalone listing).
export interface Unit {
  id: string;
  propertyId: string;
  // Denormalized from the property — same list-provability reason as
  // Expense.ownerId (see firestore.rules).
  ownerId: string;
  unitNumber: string;
  floor: number;
  type: UnitType;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  listingType: "إيجار" | "بيع" | "استثمار";
  status: PropertyStatus;
  createdAt: string;
  furnished?: boolean;
  furnitureCondition?: "جديد" | "مستخدم";
  amenities?: UnitAmenity[];
  electricityMeterNumber?: string;
  electricityMeterBilledTo?: MeterBilledTo;
  waterMeterNumber?: string;
  waterMeterBilledTo?: MeterBilledTo;
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
// "وحدة" documents (unit deed copies, meter bills, inspection reports) hang off
// a Unit; like the others they carry the denormalized ownerId.
export type DocumentEntityType = "عقار" | "وحدة" | "عقد" | "مالك" | "مستأجر";

export interface DocumentLink {
  id: string;
  title: string;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  entityLabel: string;
  // Denormalized from the linked entity at creation time (see
  // app/admin/documents) — lets an owner read just the documents tied to
  // their own properties/contracts/self, same list-provability reason as
  // Expense.ownerId (see firestore.rules).
  ownerId?: string;
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
