import type { PermissionResource, Role } from "@/lib/types";
import {
  BarChart3,
  Building2,
  CalendarClock,
  Contact,
  FileText,
  FolderOpen,
  Headset,
  History,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  PieChart,
  Receipt,
  Settings,
  ShieldCheck,
  Tag,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const roleMeta: Record<Role, { title: string; homeHref: string }> = {
  admin: { title: "مدير النظام", homeHref: "/admin" },
  owner: { title: "بوابة الملاك", homeHref: "/owner" },
  tenant: { title: "بوابة المستأجرين", homeHref: "/tenant" },
  technician: { title: "بوابة فنيي الصيانة", homeHref: "/technician" },
  accountant: { title: "بوابة المحاسب", homeHref: "/accountant" },
  leasingAgent: { title: "بوابة الوسيط", homeHref: "/leasing-agent" },
  maintenanceStaff: { title: "بوابة فريق الصيانة", homeHref: "/admin/maintenance" },
  custom: { title: "دور مخصص", homeHref: "/custom" },
};

// Maps each dynamic-permission resource to the real nav item/page that
// exposes it — see PermissionResource in lib/types.ts and app/admin/roles.
// A "custom" role's sidebar is built by filtering this against the role's
// own permission matrix (see Sidebar.tsx), not from navByRole.custom below
// (which stays empty — Record<Role,...> just needs every key present).
export const customResourceNav: Record<PermissionResource, NavItem> = {
  properties: { label: "العقارات", href: "/admin/properties", icon: Building2 },
  contracts: { label: "العقود", href: "/admin/contracts", icon: FileText },
  expenses: { label: "المصروفات", href: "/admin/expenses", icon: Wallet },
  vouchers: { label: "السندات", href: "/admin/vouchers", icon: Receipt },
  maintenanceRequests: { label: "طلبات الصيانة", href: "/admin/maintenance", icon: Wrench },
  clients: { label: "العملاء المحتملون", href: "/admin/leads", icon: UserPlus },
};

export const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    { label: "المستخدمون", href: "/admin/users", icon: Users },
    { label: "الصلاحيات", href: "/admin/roles", icon: ShieldCheck },
    { label: "إعدادات النظام", href: "/admin/settings", icon: Settings },
    { label: "العقارات", href: "/admin/properties", icon: Building2 },
    { label: "العروض", href: "/admin/listings", icon: Tag },
    { label: "العقود", href: "/admin/contracts", icon: FileText },
    { label: "العملاء", href: "/admin/clients", icon: Contact },
    { label: "المصروفات", href: "/admin/expenses", icon: Wallet },
    { label: "السندات", href: "/admin/vouchers", icon: Receipt },
    { label: "الإشغال والشغور", href: "/admin/occupancy", icon: PieChart },
    { label: "المورّدون", href: "/admin/vendors", icon: Wrench },
    { label: "طلبات الصيانة", href: "/admin/maintenance", icon: Wrench },
    { label: "العملاء المحتملون", href: "/admin/leads", icon: UserPlus },
    { label: "المستندات", href: "/admin/documents", icon: FolderOpen },
    { label: "سجل التدقيق", href: "/admin/audit-log", icon: History },
    { label: "عروض الأسعار", href: "/quotes", icon: Receipt },
    { label: "التقارير والفواتير", href: "/reports", icon: BarChart3 },
    { label: "التقارير المالية", href: "/admin/reports/financial", icon: BarChart3 },
    { label: "الدفعات القادمة", href: "/admin/reports/upcoming-payments", icon: CalendarClock },
    { label: "الخريطة التفاعلية", href: "/map", icon: MapPin },
    { label: "خدمة العملاء", href: "/support/customer", icon: Headset },
    { label: "الدعم الفني", href: "/support/technical", icon: LifeBuoy },
    { label: "مدير الحساب", href: "/account-manager", icon: UserCog },
  ],
  owner: [
    { label: "لوحة التحكم", href: "/owner", icon: LayoutDashboard },
    { label: "عروض الأسعار", href: "/quotes", icon: Receipt },
    { label: "التقارير والفواتير", href: "/reports", icon: BarChart3 },
    { label: "المستندات", href: "/owner/documents", icon: FolderOpen },
    { label: "الخريطة التفاعلية", href: "/map", icon: MapPin },
    { label: "خدمة العملاء", href: "/support/customer", icon: Headset },
    { label: "مدير الحساب", href: "/account-manager", icon: UserCog },
  ],
  tenant: [
    { label: "لوحة التحكم", href: "/tenant", icon: LayoutDashboard },
    { label: "طلبات الصيانة", href: "/tenant/maintenance", icon: Wrench },
    { label: "الفواتير", href: "/reports", icon: BarChart3 },
    { label: "خدمة العملاء", href: "/support/customer", icon: Headset },
    { label: "مدير الحساب", href: "/account-manager", icon: UserCog },
  ],
  technician: [
    { label: "أوامر العمل", href: "/technician", icon: Wrench },
    { label: "الدعم الفني", href: "/support/technical", icon: LifeBuoy },
  ],
  accountant: [
    { label: "لوحة التحكم", href: "/accountant", icon: LayoutDashboard },
    { label: "العقارات", href: "/admin/properties", icon: Building2 },
    { label: "العقود", href: "/admin/contracts", icon: FileText },
    { label: "المصروفات", href: "/admin/expenses", icon: Wallet },
    { label: "السندات", href: "/admin/vouchers", icon: Receipt },
    { label: "التقارير والفواتير", href: "/reports", icon: BarChart3 },
    { label: "التقارير المالية", href: "/admin/reports/financial", icon: BarChart3 },
    { label: "الدفعات القادمة", href: "/admin/reports/upcoming-payments", icon: CalendarClock },
    { label: "سجل العمليات", href: "/admin/audit-log", icon: History },
  ],
  leasingAgent: [
    { label: "لوحة التحكم", href: "/leasing-agent", icon: LayoutDashboard },
    { label: "العملاء المحتملون", href: "/admin/leads", icon: UserPlus },
    { label: "العقارات", href: "/admin/properties", icon: Building2 },
    { label: "العروض", href: "/admin/listings", icon: Tag },
    { label: "العقود", href: "/admin/contracts", icon: FileText },
    { label: "الخريطة التفاعلية", href: "/map", icon: MapPin },
  ],
  maintenanceStaff: [
    { label: "طلبات الصيانة", href: "/admin/maintenance", icon: Wrench },
    { label: "المورّدون", href: "/admin/vendors", icon: Wrench },
  ],
  // Built dynamically from the account's CustomRole permissions — see
  // customResourceNav above and Sidebar.tsx. Empty here on purpose.
  custom: [],
};
