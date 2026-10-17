import { getLang } from "./i18n/state";
import { generatePaymentSchedule } from "./contracts/schedule";
import type {
  AccountManager,
  Client,
  Contract,
  DocumentLink,
  Expense,
  Invoice,
  MaintenanceRequest,
  Owner,
  Property,
  PropertyType,
  Quote,
  SupportTicket,
  SystemUser,
  Technician,
  Tenant,
  Unit,
  Vendor,
  Viewing,
} from "./types";

// Per Saudi VAT regulations: residential rentals/sales are VAT-exempt;
// commercial ones carry 15% VAT — confirmed against real Ejar (REGA)
// tenancy contracts, which show a VAT line only on the commercial contract.
const COMMERCIAL_PROPERTY_TYPES: PropertyType[] = ["محل تجاري", "مكتب"];

export function taxRateForPropertyType(type: PropertyType): number {
  return COMMERCIAL_PROPERTY_TYPES.includes(type) ? 0.15 : 0;
}

// The platform operator's own VAT registration number, shown on generated
// invoices/quotes when VAT applies (required on any ZATCA-compliant
// invoice that includes VAT).
export const COMPANY_VAT_NUMBER = "310650016400003";

// Used for the owner statement calculation when an owner doesn't have an
// explicit managementFeeRate set.
export const DEFAULT_MANAGEMENT_FEE_RATE = 0.1;

export const owners: Owner[] = [
  { id: "own-1", name: "عبدالله السبيعي", phone: "0551234567", email: "abdullah.s@mail.com", joinedAt: "2021-03-14" },
  { id: "own-2", name: "منيرة القحطاني", phone: "0559876543", email: "muneera.q@mail.com", joinedAt: "2020-07-02" },
  { id: "own-3", name: "فيصل الدوسري", phone: "0567654321", email: "faisal.d@mail.com", joinedAt: "2022-01-20" },
  { id: "own-4", name: "هند العتيبي", phone: "0541122334", email: "hind.o@mail.com", joinedAt: "2019-11-09" },
  { id: "own-5", name: "سلطان الشهري", phone: "0533344556", email: "sultan.sh@mail.com", joinedAt: "2025-05-01" },
];

export const properties: Property[] = [
  { id: "prop-1", title: "شقة فاخرة بحي الملقا", type: "شقة", city: "الرياض", district: "الملقا", address: "شارع الأمير تركي، الملقا", area: 180, bedrooms: 3, bathrooms: 2, price: 65000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-1", lat: 24.7930, lng: 46.6220, color: "#3563f4", createdAt: "2026-01-10" },
  { id: "prop-2", title: "فيلا دورين بحي النرجس", type: "فيلا", city: "الرياض", district: "النرجس", address: "شارع الأمير سعود، النرجس", area: 420, bedrooms: 6, bathrooms: 5, price: 1850000, listingType: "بيع", status: "متاحة", ownerId: "own-2", lat: 24.8360, lng: 46.6480, color: "#1c3ab3", createdAt: "2026-02-18" },
  { id: "prop-3", title: "شقة عوائل بحي الروضة", type: "شقة", city: "جدة", district: "الروضة", address: "شارع فلسطين، الروضة", area: 150, bedrooms: 2, bathrooms: 2, price: 42000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-3", lat: 21.5810, lng: 39.1720, color: "#e8a415", createdAt: "2026-03-02" },
  { id: "prop-4", title: "مكتب إداري ببرج الأعمال", type: "مكتب", city: "الرياض", district: "العليا", address: "طريق الملك فهد، العليا", area: 95, bedrooms: 0, bathrooms: 1, price: 55000, listingType: "إيجار", status: "متاحة", ownerId: "own-1", lat: 24.6980, lng: 46.6850, color: "#1fa35c", createdAt: "2026-01-27" },
  { id: "prop-5", title: "محل تجاري بواجهة رئيسية", type: "محل تجاري", city: "الدمام", district: "الشاطئ", address: "كورنيش الدمام، الشاطئ", area: 60, bedrooms: 0, bathrooms: 1, price: 38000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-4", lat: 26.4370, lng: 50.1030, color: "#e0a318", createdAt: "2025-11-15" },
  { id: "prop-6", title: "فيلا راقية بحي الشاطئ", type: "فيلا", city: "جدة", district: "الشاطئ", address: "شارع الكورنيش، الشاطئ", area: 500, bedrooms: 7, bathrooms: 6, price: 2450000, listingType: "بيع", status: "متاحة", ownerId: "own-5", lat: 21.5940, lng: 39.0870, color: "#3563f4", createdAt: "2026-04-05" },
  { id: "prop-7", title: "شقة استثمارية بحي العزيزية", type: "شقة", city: "الدمام", district: "العزيزية", address: "شارع الأمير محمد، العزيزية", area: 130, bedrooms: 2, bathrooms: 1, price: 32000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-2", lat: 26.4110, lng: 50.0780, color: "#dc3b3b", createdAt: "2026-02-09" },
  { id: "prop-8", title: "أرض سكنية بحي القيروان", type: "أرض", city: "الرياض", district: "القيروان", address: "شارع أنس بن مالك، القيروان", area: 600, bedrooms: 0, bathrooms: 0, price: 980000, listingType: "بيع", status: "متاحة", ownerId: "own-3", lat: 24.8120, lng: 46.6100, color: "#2196d8", createdAt: "2025-09-22" },
  { id: "prop-9", title: "استراحة عائلية بطريق الخرج", type: "استراحة", city: "الرياض", district: "طريق الخرج", address: "طريق الخرج، ضاحية نمار", area: 800, bedrooms: 4, bathrooms: 3, price: 28000, listingType: "إيجار", status: "متاحة", ownerId: "own-4", lat: 24.5600, lng: 46.7200, color: "#1fa35c", createdAt: "2026-05-12" },
  { id: "prop-10", title: "شقة عصرية بحي الياسمين", type: "شقة", city: "الرياض", district: "الياسمين", address: "شارع أنس بن مالك، الياسمين", area: 165, bedrooms: 3, bathrooms: 2, price: 58000, listingType: "إيجار", status: "تحت الصيانة", ownerId: "own-5", lat: 24.8580, lng: 46.6330, color: "#e8a415", createdAt: "2026-06-01" },
  { id: "prop-11", title: "مكتب مشترك بحي الورود", type: "مكتب", city: "الرياض", district: "الورود", address: "شارع التخصصي، الورود", area: 70, bedrooms: 0, bathrooms: 1, price: 34000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-1", lat: 24.7150, lng: 46.6700, color: "#1c3ab3", createdAt: "2025-12-19" },
  { id: "prop-12", title: "فيلا مودرن بحي الياسمين", type: "فيلا", city: "الرياض", district: "الياسمين", address: "شارع الملك عبدالله، الياسمين", area: 380, bedrooms: 5, bathrooms: 4, price: 1650000, listingType: "بيع", status: "مباعة", ownerId: "own-2", lat: 24.8500, lng: 46.6400, color: "#3563f4", createdAt: "2025-10-08" },
  { id: "prop-13", title: "شقة قريبة من الحرم", type: "شقة", city: "مكة المكرمة", district: "العزيزية", address: "شارع الستين، العزيزية", area: 110, bedrooms: 2, bathrooms: 1, price: 45000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-3", lat: 21.4100, lng: 39.8300, color: "#dc3b3b", createdAt: "2026-03-27" },
  { id: "prop-14", title: "شقة بإطلالة بحرية بالخبر", type: "شقة", city: "الخبر", district: "الكورنيش", address: "كورنيش الخبر", area: 140, bedrooms: 3, bathrooms: 2, price: 48000, listingType: "إيجار", status: "متاحة", ownerId: "own-4", lat: 26.2790, lng: 50.2130, color: "#2196d8", createdAt: "2026-04-30" },
  { id: "prop-15", title: "محل بمجمع تجاري بالمدينة", type: "محل تجاري", city: "المدينة المنورة", district: "قربان", address: "طريق الأمير عبدالمجيد، قربان", area: 85, bedrooms: 0, bathrooms: 1, price: 41000, listingType: "إيجار", status: "متاحة", ownerId: "own-5", lat: 24.4750, lng: 39.6100, color: "#e0a318", createdAt: "2026-01-05" },
  { id: "prop-16", title: "فيلا بحديقة بحي الفلاح", type: "فيلا", city: "جدة", district: "الفلاح", address: "شارع فلسطين، الفلاح", area: 340, bedrooms: 5, bathrooms: 4, price: 1450000, listingType: "بيع", status: "متاحة", ownerId: "own-1", lat: 21.6120, lng: 39.1420, color: "#1fa35c", createdAt: "2025-08-14" },
  { id: "prop-17", title: "شقة اقتصادية بحي السلي", type: "شقة", city: "الرياض", district: "السلي", address: "شارع السلي العام", area: 100, bedrooms: 2, bathrooms: 1, price: 27000, listingType: "إيجار", status: "مؤجرة", ownerId: "own-2", lat: 24.6300, lng: 46.7500, color: "#3563f4", createdAt: "2026-02-22" },
  { id: "prop-18", title: "أرض تجارية على شارع رئيسي", type: "أرض", city: "الدمام", district: "الفيصلية", address: "طريق الملك فهد، الفيصلية", area: 750, bedrooms: 0, bathrooms: 0, price: 1250000, listingType: "بيع", status: "متاحة", ownerId: "own-3", lat: 26.4550, lng: 50.0900, color: "#1c3ab3", createdAt: "2025-07-01" },
];

export const tenants: Tenant[] = [
  { id: "ten-1", name: "خالد المطيري", phone: "0501112233", email: "khaled.m@mail.com", propertyId: "prop-1", contractId: "con-1" },
  { id: "ten-2", name: "نورة الحربي", phone: "0502223344", email: "noura.h@mail.com", propertyId: "prop-3", contractId: "con-2" },
  { id: "ten-3", name: "تركي الغامدي", phone: "0503334455", email: "turki.g@mail.com", propertyId: "prop-5", contractId: "con-3" },
  { id: "ten-4", name: "ريم الزهراني", phone: "0504445566", email: "reem.z@mail.com", propertyId: "prop-7", contractId: "con-4" },
  { id: "ten-5", name: "بندر العنزي", phone: "0505556677", email: "bandar.a@mail.com", propertyId: "prop-11", contractId: "con-5" },
  { id: "ten-6", name: "لمى القرني", phone: "0506667788", email: "lama.q@mail.com", propertyId: "prop-13", contractId: "con-6" },
  { id: "ten-7", name: "سعود الرشيد", phone: "0507778899", email: "saud.r@mail.com", propertyId: "prop-17", contractId: "con-7" },
];

const rawContracts: Omit<Contract, "payments">[] = [
  { id: "con-1", propertyId: "prop-1", ownerId: "own-1", tenantId: "ten-1", type: "إيجار", signedAt: "2026-01-20", startDate: "2026-02-01", endDate: "2028-01-31", value: 65000, paymentCycle: "سنوي", status: "نشط" },
  { id: "con-2", propertyId: "prop-3", ownerId: "own-3", tenantId: "ten-2", type: "إيجار", signedAt: "2026-03-05", startDate: "2026-03-15", endDate: "2027-03-14", value: 42000, paymentCycle: "سنوي", status: "نشط" },
  { id: "con-3", propertyId: "prop-5", ownerId: "own-4", tenantId: "ten-3", type: "إيجار", signedAt: "2025-11-20", startDate: "2025-12-01", endDate: "2027-11-30", value: 38000, paymentCycle: "سنوي", status: "نشط" },
  // Deliberately near-term (relative to "today" in this demo dataset) so the
  // notifications feature has something real to surface out of the box.
  { id: "con-4", propertyId: "prop-7", ownerId: "own-2", tenantId: "ten-4", type: "إيجار", signedAt: "2026-02-10", startDate: "2026-02-20", endDate: "2026-08-20", value: 32000, paymentCycle: "ربع سنوي", status: "قيد التجديد" },
  { id: "con-5", propertyId: "prop-11", ownerId: "own-1", tenantId: "ten-5", type: "إيجار", signedAt: "2025-12-20", startDate: "2026-01-01", endDate: "2026-12-31", value: 34000, paymentCycle: "شهري", status: "منتهي" },
  { id: "con-6", propertyId: "prop-13", ownerId: "own-3", tenantId: "ten-6", type: "إيجار", signedAt: "2026-03-20", startDate: "2026-04-01", endDate: "2027-03-31", value: 45000, paymentCycle: "نصف سنوي", status: "نشط" },
  { id: "con-7", propertyId: "prop-17", ownerId: "own-2", tenantId: "ten-7", type: "إيجار", signedAt: "2026-02-15", startDate: "2026-03-01", endDate: "2027-02-28", value: 27000, paymentCycle: "سنوي", status: "نشط" },
  { id: "con-8", propertyId: "prop-12", ownerId: "own-2", tenantId: "ten-1", type: "بيع", signedAt: "2025-10-20", startDate: "2025-10-20", endDate: "2025-10-20", value: 1650000, paymentCycle: "سنوي", status: "منتهي" },
];

export const contracts: Contract[] = rawContracts.map((c) => ({
  ...c,
  payments: generatePaymentSchedule(c.startDate, c.endDate, c.value, c.paymentCycle),
}));

export const clients: Client[] = [
  ...owners.map((o): Client => ({ id: o.id, name: o.name, phone: o.phone, email: o.email ?? "", type: "مالك", joinedAt: o.joinedAt })),
  ...tenants.map((t, i): Client => ({ id: t.id, name: t.name, phone: t.phone, email: t.email ?? "", type: "مستأجر", joinedAt: contracts[i]?.startDate ?? "2026-01-01" })),
  { id: "lead-1", name: "عمر الشمري", phone: "0511223344", email: "omar.sh@mail.com", type: "عميل محتمل", joinedAt: "2026-07-01", stage: "تواصل أولي", interestedPropertyId: "prop-2" },
  { id: "lead-2", name: "دانة العصيمي", phone: "0512233445", email: "dana.a@mail.com", type: "عميل محتمل", joinedAt: "2026-07-18", stage: "معاينة مجدولة", interestedPropertyId: "prop-10" },
  { id: "lead-3", name: "ماجد القحطاني", phone: "0513344556", email: "majed.q@mail.com", type: "عميل محتمل", joinedAt: "2026-08-02", stage: "عرض مقدم", interestedPropertyId: "prop-8" },
];

// A property can optionally branch into units (see Unit in lib/types.ts) —
// modeled here on prop-1 (a standalone-looking apartment listing that's
// really a small residential building) and prop-5 (a commercial storefront
// property with multiple retail units).
export const units: Unit[] = [
  { id: "unit-1", propertyId: "prop-1", ownerId: "own-1", unitNumber: "101", floor: 1, type: "شقة", area: 120, bedrooms: 2, bathrooms: 2, price: 42000, listingType: "إيجار", status: "مؤجرة", createdAt: "2026-01-15" },
  { id: "unit-2", propertyId: "prop-1", ownerId: "own-1", unitNumber: "102", floor: 1, type: "شقة", area: 130, bedrooms: 3, bathrooms: 2, price: 48000, listingType: "إيجار", status: "متاحة", createdAt: "2026-01-15" },
  { id: "unit-3", propertyId: "prop-1", ownerId: "own-1", unitNumber: "201", floor: 2, type: "شقة", area: 125, bedrooms: 2, bathrooms: 2, price: 45000, listingType: "إيجار", status: "تحت الصيانة", createdAt: "2026-01-15" },
  { id: "unit-4", propertyId: "prop-5", ownerId: "own-4", unitNumber: "G1", floor: 0, type: "محل", area: 60, bedrooms: 0, bathrooms: 1, price: 35000, listingType: "إيجار", status: "مؤجرة", createdAt: "2026-02-10" },
  { id: "unit-5", propertyId: "prop-5", ownerId: "own-4", unitNumber: "G2", floor: 0, type: "محل", area: 55, bedrooms: 0, bathrooms: 1, price: 32000, listingType: "إيجار", status: "متاحة", createdAt: "2026-02-10" },
  { id: "unit-6", propertyId: "prop-5", ownerId: "own-4", unitNumber: "M1", floor: 1, type: "مكتب", area: 80, bedrooms: 0, bathrooms: 1, price: 40000, listingType: "إيجار", status: "متاحة", createdAt: "2026-02-10" },
];

export const vendors: Vendor[] = [
  { id: "vnd-1", name: "مؤسسة النجم للسباكة", category: "سباكة", phone: "0541002001", email: "info@alnajm-plumbing.example.com", notes: "تعاقد سنوي لأعمال السباكة الطارئة", createdAt: "2025-11-01" },
  { id: "vnd-2", name: "شركة الأفق للكهرباء", category: "كهرباء", phone: "0541002002", createdAt: "2025-12-05" },
  { id: "vnd-3", name: "مجموعة السلامة للأمن", category: "أمن", phone: "0541002003", email: "ops@safety-group.example.com", createdAt: "2026-01-10" },
  { id: "vnd-4", name: "مؤسسة التميز للتكييف", category: "تكييف", phone: "0541002004", notes: "صيانة دورية للمكيفات المركزية", createdAt: "2026-03-01" },
];

export const viewings: Viewing[] = [
  { id: "view-1", leadId: "lead-2", propertyId: "prop-10", scheduledAt: "2026-08-14", status: "مجدولة", notes: "معاينة أولى بعد الظهر", createdAt: "2026-08-08" },
  { id: "view-2", leadId: "lead-1", propertyId: "prop-2", scheduledAt: "2026-07-25", status: "مكتملة", notes: "أبدى اهتمامًا بالفيلا", createdAt: "2026-07-20" },
  { id: "view-3", leadId: "lead-3", propertyId: "prop-8", scheduledAt: "2026-08-05", status: "مكتملة", notes: "تفاوض على السعر جارٍ", createdAt: "2026-08-01" },
];

// Placeholder URLs (example.com) — real usage has the admin paste a link to
// an actually-hosted file (Drive, email, etc.) via app/admin/documents.
export const documentLinks: DocumentLink[] = [
  { id: "doc-u1", title: "فاتورة عداد الكهرباء - وحدة 101", category: "فاتورة", entityType: "وحدة", entityId: "unit-1", entityLabel: "شقة فاخرة بحي الملقا — وحدة 101", ownerId: "own-1", url: "https://drive.example.com/docs/unit-1-electricity.pdf", createdAt: "2026-03-05" },
  { id: "doc-u2", title: "تقرير فحص الوحدة 102", category: "أخرى", entityType: "وحدة", entityId: "unit-2", entityLabel: "شقة فاخرة بحي الملقا — وحدة 102", ownerId: "own-1", url: "https://drive.example.com/docs/unit-2-inspection.pdf", createdAt: "2026-03-12" },
  { id: "doc-1", title: "عقد إيجار شقة الملقا", category: "عقد", entityType: "عقد", entityId: "con-1", entityLabel: "CON-1", ownerId: "own-1", url: "https://drive.example.com/docs/con-1-lease.pdf", createdAt: "2026-02-01" },
  { id: "doc-2", title: "صك ملكية فيلا النرجس", category: "صك ملكية", entityType: "عقار", entityId: "prop-2", entityLabel: "فيلا دورين بحي النرجس", ownerId: "own-2", url: "https://drive.example.com/docs/prop-2-deed.pdf", createdAt: "2026-02-20" },
  { id: "doc-3", title: "وثيقة تأمين شقة الملقا", category: "تأمين", entityType: "عقار", entityId: "prop-1", entityLabel: "شقة فاخرة بحي الملقا", ownerId: "own-1", url: "https://drive.example.com/docs/prop-1-insurance.pdf", createdAt: "2026-01-20" },
];

export const expenses: Expense[] = [
  { id: "exp-1", propertyId: "prop-1", ownerId: "own-1", category: "صيانة", items: [{ description: "دهانات", amount: 100 }, { description: "خلاطات", amount: 400 }, { description: "أجرة عمل (شغل يد)", amount: 300 }], amount: 800, date: "2026-03-05", vendorName: "فريق الصيانة الداخلي", status: "مدفوعة" },
  { id: "exp-2", propertyId: "prop-1", ownerId: "own-1", category: "تأمين", items: [{ description: "قسط تأمين العقار السنوي", amount: 1200 }], amount: 1200, date: "2026-02-15", status: "معلقة" },
  { id: "exp-3", propertyId: "prop-3", ownerId: "own-3", category: "كهرباء", items: [{ description: "فاتورة استهلاك كهرباء", amount: 450 }], amount: 450, date: "2026-04-01", status: "مدفوعة" },
  { id: "exp-4", propertyId: "prop-3", ownerId: "own-3", category: "صيانة", items: [{ description: "فحص وصيانة دورية", amount: 250 }, { description: "قطع غيار", amount: 200 }, { description: "أجرة فني", amount: 150 }], amount: 600, date: "2026-05-10", vendorName: "مؤسسة الفا للصيانة", status: "معلقة" },
  { id: "exp-5", propertyId: "prop-5", ownerId: "own-4", category: "أمن", items: [{ description: "رسوم خدمة الحراسة الأمنية — شهر", amount: 900 }], amount: 900, date: "2026-01-20", vendorName: "شركة الحارس الأمنية", status: "مدفوعة" },
  { id: "exp-6", propertyId: "prop-5", ownerId: "own-4", category: "رسوم حكومية", items: [{ description: "رسوم بلدية", amount: 200 }, { description: "رسوم صك إلكتروني", amount: 150 }], amount: 350, date: "2026-06-01", status: "مدفوعة" },
  { id: "exp-7", propertyId: "prop-7", ownerId: "own-2", category: "صيانة", items: [{ description: "إصلاح تسريب مياه", amount: 300 }, { description: "مواد سباكة", amount: 200 }], amount: 500, date: "2026-03-20", status: "معلقة" },
  { id: "exp-8", propertyId: "prop-7", ownerId: "own-2", category: "تنظيف", items: [{ description: "تنظيف شامل بعد إخلاء المستأجر", amount: 300 }], amount: 300, date: "2026-07-01", vendorName: "مؤسسة النظافة الشاملة", status: "مدفوعة" },
  { id: "exp-9", propertyId: "prop-11", ownerId: "own-1", category: "كهرباء", items: [{ description: "فاتورة استهلاك كهرباء", amount: 700 }], amount: 700, date: "2026-02-10", status: "مدفوعة" },
  { id: "exp-10", propertyId: "prop-11", ownerId: "own-1", category: "صيانة", items: [{ description: "صيانة تكييف مركزي", amount: 600 }, { description: "قطع غيار وفريونات", amount: 350 }, { description: "أجرة فني", amount: 150 }], amount: 1100, date: "2026-04-15", vendorName: "مؤسسة الفا للصيانة", status: "معلقة" },
  { id: "exp-11", propertyId: "prop-13", ownerId: "own-3", category: "تأمين", items: [{ description: "قسط تأمين العقار السنوي", amount: 950 }], amount: 950, date: "2026-05-01", status: "مدفوعة" },
  { id: "exp-12", propertyId: "prop-13", ownerId: "own-3", category: "مياه", items: [{ description: "فاتورة استهلاك مياه", amount: 200 }], amount: 200, date: "2026-06-20", status: "مدفوعة" },
  { id: "exp-13", propertyId: "prop-17", ownerId: "own-2", category: "صيانة", items: [{ description: "دهانات وترميم بسيط", amount: 250 }, { description: "أجرة عمل (شغل يد)", amount: 150 }], amount: 400, date: "2026-03-15", status: "مدفوعة" },
  { id: "exp-14", propertyId: "prop-17", ownerId: "own-2", category: "رسوم حكومية", items: [{ description: "رسوم صك إلكتروني", amount: 250 }], amount: 250, date: "2026-07-10", status: "معلقة" },
];

export const invoices: Invoice[] = [
  { id: "inv-1", number: "INV-2026-101", clientName: "خالد المطيري", propertyTitle: "شقة فاخرة بحي الملقا", ownerId: "own-1", tenantId: "ten-1", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 65000 }], taxRate: 0, issueDate: "2026-02-01", dueDate: "2026-02-10", status: "مدفوعة" },
  { id: "inv-2", number: "INV-2026-102", clientName: "نورة الحربي", propertyTitle: "شقة عوائل بحي الروضة", ownerId: "own-3", tenantId: "ten-2", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 42000 }], taxRate: 0, issueDate: "2026-03-15", dueDate: "2026-03-25", status: "مدفوعة" },
  { id: "inv-3", number: "INV-2026-103", clientName: "تركي الغامدي", propertyTitle: "محل تجاري بواجهة رئيسية", ownerId: "own-4", tenantId: "ten-3", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 38000 }], taxRate: 0.15, issueDate: "2025-12-01", dueDate: "2025-12-10", status: "مدفوعة" },
  { id: "inv-4", number: "INV-2026-104", clientName: "ريم الزهراني", propertyTitle: "شقة استثمارية بحي العزيزية", ownerId: "own-2", tenantId: "ten-4", items: [{ description: "إيجار ربع سنوي", quantity: 1, unitPrice: 8000 }], taxRate: 0, issueDate: "2026-08-01", dueDate: "2026-08-10", status: "معلقة" },
  { id: "inv-5", number: "INV-2026-105", clientName: "لمى القرني", propertyTitle: "شقة قريبة من الحرم", ownerId: "own-3", tenantId: "ten-6", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 45000 }], taxRate: 0, issueDate: "2026-04-01", dueDate: "2026-04-10", status: "مدفوعة" },
  { id: "inv-6", number: "INV-2026-106", clientName: "سعود الرشيد", propertyTitle: "شقة اقتصادية بحي السلي", ownerId: "own-2", tenantId: "ten-7", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 27000 }], taxRate: 0, issueDate: "2026-03-01", dueDate: "2026-03-10", status: "متأخرة" },
  { id: "inv-7", number: "INV-2026-107", clientName: "بندر العنزي", propertyTitle: "مكتب مشترك بحي الورود", ownerId: "own-1", tenantId: "ten-5", items: [{ description: "إيجار شهري", quantity: 1, unitPrice: 2833 }], taxRate: 0.15, issueDate: "2026-07-01", dueDate: "2026-07-05", status: "معلقة" },
  // Sale, not a rental — no tenantId (the buyer isn't a rental tenant record).
  { id: "inv-8", number: "INV-2026-108", clientName: "خالد المطيري", propertyTitle: "فيلا مودرن بحي الياسمين", ownerId: "own-2", items: [{ description: "دفعة شراء", quantity: 1, unitPrice: 1650000 }], taxRate: 0, issueDate: "2025-10-20", dueDate: "2025-10-25", status: "مدفوعة" },
];

export const quotes: Quote[] = [
  { id: "q-1", number: "QT-2026-201", clientName: "عمر الشمري", propertyTitle: "فيلا دورين بحي النرجس", ownerId: "own-2", items: [{ description: "سعر الفيلا", quantity: 1, unitPrice: 1850000 }, { description: "رسوم خدمات الوساطة", quantity: 1, unitPrice: 18500 }], taxRate: 0, status: "مرسل", createdAt: "2026-08-01", validUntil: "2026-08-15", notes: "السعر شامل رسوم النقل الأساسية." },
  { id: "q-2", number: "QT-2026-202", clientName: "دانة العصيمي", propertyTitle: "شقة عصرية بحي الياسمين", ownerId: "own-5", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 58000 }, { description: "تأمين استرجاعي", quantity: 1, unitPrice: 5800 }], taxRate: 0, status: "مسودة", createdAt: "2026-08-05", validUntil: "2026-08-20" },
  { id: "q-3", number: "QT-2026-203", clientName: "ماجد القحطاني", propertyTitle: "أرض سكنية بحي القيروان", ownerId: "own-3", items: [{ description: "سعر الأرض", quantity: 1, unitPrice: 980000 }], taxRate: 0, status: "مقبول", createdAt: "2026-07-20", validUntil: "2026-08-05" },
  { id: "q-4", number: "QT-2026-204", clientName: "خالد المطيري", propertyTitle: "مكتب إداري ببرج الأعمال", ownerId: "own-1", items: [{ description: "إيجار سنوي", quantity: 1, unitPrice: 55000 }], taxRate: 0.15, status: "مرفوض", createdAt: "2026-06-10", validUntil: "2026-06-25" },
];

export const technicians: Technician[] = [
  { id: "tech-1", name: "ياسر العمري", specialty: "كهرباء", phone: "0521112233", rating: 4.8 },
  { id: "tech-2", name: "فهد الجهني", specialty: "سباكة", phone: "0522223344", rating: 4.6 },
  { id: "tech-3", name: "عبدالرحمن باوزير", specialty: "تكييف", phone: "0523334455", rating: 4.9 },
  { id: "tech-4", name: "وليد السهلي", specialty: "صيانة عامة", phone: "0524445566", rating: 4.5 },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: "mr-1", propertyId: "prop-10", tenantName: "منشأة شاغرة", technicianId: "tech-3", title: "عطل في وحدة التكييف المركزي", description: "لا يعمل التكييف في الطابق الثاني منذ يومين.", priority: "عاجل", status: "قيد التنفيذ", createdAt: "2026-08-05", scheduledDate: "2026-08-11" },
  { id: "mr-2", propertyId: "prop-1", tenantName: "خالد المطيري", technicianId: "tech-2", title: "تسريب مياه في المطبخ", description: "تسريب بسيط أسفل حوض المطبخ.", priority: "متوسط", status: "جديد", createdAt: "2026-08-08" },
  { id: "mr-3", propertyId: "prop-3", tenantName: "نورة الحربي", technicianId: "tech-1", title: "عطل كهربائي في غرفة النوم", description: "انقطاع متكرر للكهرباء في غرفة النوم الرئيسية.", priority: "عاجل", status: "جديد", createdAt: "2026-08-09" },
  { id: "mr-4", propertyId: "prop-7", tenantName: "ريم الزهراني", technicianId: "tech-4", title: "صيانة أبواب الخزائن", description: "بعض أبواب الخزائن بحاجة لضبط المفصلات.", priority: "منخفض", status: "مكتمل", createdAt: "2026-07-20", scheduledDate: "2026-07-25" },
  { id: "mr-5", propertyId: "prop-13", tenantName: "لمى القرني", technicianId: "tech-3", title: "ضعف تبريد المكيفات", description: "المكيفات لا تبرد بالشكل المطلوب في فصل الصيف.", priority: "متوسط", status: "قيد التنفيذ", createdAt: "2026-08-01", scheduledDate: "2026-08-12" },
  { id: "mr-6", propertyId: "prop-17", tenantName: "سعود الرشيد", technicianId: null, title: "استبدال مصباح المدخل", description: "المصباح الخارجي للمدخل معطل.", priority: "منخفض", status: "جديد", createdAt: "2026-08-09" },
];

export const supportTickets: SupportTicket[] = [
  { id: "tk-1", number: "TCK-3001", subject: "استفسار عن موعد تجديد العقد", category: "خدمة العملاء", from: "خالد المطيري", priority: "متوسط", status: "قيد المعالجة", createdAt: "2026-08-07", description: "أرغب في معرفة إجراءات تجديد عقد الإيجار الخاص بي قبل انتهائه." },
  { id: "tk-2", number: "TCK-3002", subject: "مشكلة في تسجيل الدخول للبوابة", category: "الدعم الفني", from: "نورة الحربي", priority: "عاجل", status: "مفتوحة", createdAt: "2026-08-09", description: "لا أستطيع تسجيل الدخول إلى بوابة المستأجرين منذ الصباح." },
  { id: "tk-3", number: "TCK-3003", subject: "طلب نسخة من الفاتورة", category: "خدمة العملاء", from: "تركي الغامدي", priority: "منخفض", status: "مغلقة", createdAt: "2026-07-28", description: "أحتاج نسخة إلكترونية من آخر فاتورة إيجار." },
  { id: "tk-4", number: "TCK-3004", subject: "خطأ في عرض بيانات العقار", category: "الدعم الفني", from: "ريم الزهراني", priority: "متوسط", status: "قيد المعالجة", createdAt: "2026-08-08", description: "بيانات المساحة الظاهرة للعقار غير صحيحة." },
  { id: "tk-5", number: "TCK-3005", subject: "استفسار حول رسوم الخدمة", category: "خدمة العملاء", from: "لمى القرني", priority: "منخفض", status: "مفتوحة", createdAt: "2026-08-10", description: "ما هي رسوم الخدمة المطبقة على عقد الإيجار السنوي؟" },
];

export const accountManagers: AccountManager[] = [
  { id: "am-1", name: "سارة الدوسري", title: "مديرة حسابات كبار العملاء", phone: "0531002000", email: "sara.doussari@amlakms.sa", color: "#3563f4", bio: "مسؤولة عن متابعة حسابات الملاك الاستراتيجيين وتنسيق الخدمات المخصصة لهم." },
];

export const systemUsers: SystemUser[] = [
  { id: "usr-1", name: "سارة الدوسري", email: "sara.doussari@amlakms.sa", role: "مدير حساب", status: "نشط", lastLogin: "2026-08-10 09:12" },
  { id: "usr-2", name: "مدير النظام", email: "admin@amlakms.sa", role: "admin", status: "نشط", lastLogin: "2026-08-10 08:40" },
  ...owners.map((o): SystemUser => ({ id: o.id, name: o.name, email: o.email ?? "", role: "owner", status: "نشط", lastLogin: "2026-08-09 21:05" })),
  ...tenants.map((t): SystemUser => ({ id: t.id, name: t.name, email: t.email ?? "", role: "tenant", status: "نشط", lastLogin: "2026-08-09 18:30" })),
  ...technicians.map((t): SystemUser => ({ id: t.id, name: t.name, email: `${t.id}@amlakms.sa`, role: "technician", status: "نشط", lastLogin: "2026-08-10 07:15" })),
];

export const monthlyRevenue = [
  { month: "مارس", revenue: 148000, expenses: 32000 },
  { month: "أبريل", revenue: 162000, expenses: 29000 },
  { month: "مايو", revenue: 171000, expenses: 35000 },
  { month: "يونيو", revenue: 158000, expenses: 31000 },
  { month: "يوليو", revenue: 189000, expenses: 40000 },
  { month: "أغسطس", revenue: 176000, expenses: 33000 },
];

export const propertyTypeDistribution = [
  { name: "شقة", value: properties.filter((p) => p.type === "شقة").length },
  { name: "فيلا", value: properties.filter((p) => p.type === "فيلا").length },
  { name: "مكتب", value: properties.filter((p) => p.type === "مكتب").length },
  { name: "محل تجاري", value: properties.filter((p) => p.type === "محل تجاري").length },
  { name: "أرض", value: properties.filter((p) => p.type === "أرض").length },
  { name: "استراحة", value: properties.filter((p) => p.type === "استراحة").length },
].filter((d) => d.value > 0);

export const contractsByStatus = [
  { name: "نشط", value: contracts.filter((c) => c.status === "نشط").length },
  { name: "منتهي", value: contracts.filter((c) => c.status === "منتهي").length },
  { name: "قيد التجديد", value: contracts.filter((c) => c.status === "قيد التجديد").length },
];

export function getPropertyById(id: string) {
  return properties.find((p) => p.id === id);
}

export function getOwnerById(id: string) {
  return owners.find((o) => o.id === id);
}

export function getTechnicianById(id: string | null) {
  if (!id) return undefined;
  return technicians.find((t) => t.id === id);
}

export function currency(value: number) {
  if (getLang() === "en") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " SAR";
  }
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value) + " ﷼";
}
