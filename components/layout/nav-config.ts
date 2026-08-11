import type { Role } from "@/lib/types";
import {
  BarChart3,
  Building2,
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
};

export const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    { label: "المستخدمون", href: "/admin/users", icon: Users },
    { label: "العقارات", href: "/admin/properties", icon: Building2 },
    { label: "العقود", href: "/admin/contracts", icon: FileText },
    { label: "العملاء", href: "/admin/clients", icon: Contact },
    { label: "المصروفات", href: "/admin/expenses", icon: Wallet },
    { label: "الإشغال والشغور", href: "/admin/occupancy", icon: PieChart },
    { label: "المباني والوحدات", href: "/admin/buildings", icon: Building2 },
    { label: "المورّدون", href: "/admin/vendors", icon: Wrench },
    { label: "طلبات الصيانة", href: "/admin/maintenance", icon: Wrench },
    { label: "العملاء المحتملون", href: "/admin/leads", icon: UserPlus },
    { label: "المستندات", href: "/admin/documents", icon: FolderOpen },
    { label: "سجل التدقيق", href: "/admin/audit-log", icon: History },
    { label: "عروض الأسعار", href: "/quotes", icon: Receipt },
    { label: "التقارير والفواتير", href: "/reports", icon: BarChart3 },
    { label: "الخريطة التفاعلية", href: "/map", icon: MapPin },
    { label: "خدمة العملاء", href: "/support/customer", icon: Headset },
    { label: "الدعم الفني", href: "/support/technical", icon: LifeBuoy },
    { label: "مدير الحساب", href: "/account-manager", icon: UserCog },
  ],
  owner: [
    { label: "لوحة التحكم", href: "/owner", icon: LayoutDashboard },
    { label: "عروض الأسعار", href: "/quotes", icon: Receipt },
    { label: "التقارير والفواتير", href: "/reports", icon: BarChart3 },
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
};
