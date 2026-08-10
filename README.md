# أملاك MS — نظام إدارة الأملاك (نسخة تجريبية)

منصة تجريبية شاملة لإدارة الأملاك مبنية بـ **Next.js + TypeScript + Tailwind CSS**، تعرض كل بوابات النظام
المطلوبة بواجهة عربية (RTL) وبيانات وهمية. لا توجد خلفية (Backend) أو قاعدة بيانات حقيقية — كل البيانات
مصدرها `lib/mock-data.ts`، والمصادقة شكلية بالكامل (اختيار الدور فقط، بدون كلمة مرور حقيقية).

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## البوابات المتاحة

| البوابة | المسار | الدور المطلوب |
|---|---|---|
| الصفحة الرئيسية | `/` | عام |
| تسجيل الدخول | `/login` | عام |
| لوحة تحكم المدير (عدد المستخدمين، العقارات، العقود، العملاء + رسوم بيانية BI) | `/admin` | admin |
| المستخدمون / العقارات / العقود / العملاء | `/admin/users`, `/admin/properties`, `/admin/contracts`, `/admin/clients` | admin |
| بوابة ملاك العقار | `/owner` | owner |
| بوابة المستأجرين + طلبات الصيانة | `/tenant`, `/tenant/maintenance` | tenant |
| بوابة فنيي الصيانة | `/technician` | technician |
| عروض الأسعار (إنشاء + تصدير PDF) | `/quotes`, `/quotes/[id]/print` | admin, owner |
| التقارير والفواتير (BI + تصدير PDF) | `/reports`, `/reports/invoices/[id]/print` | admin, owner, tenant |
| خدمة العملاء | `/support/customer` | admin, owner, tenant |
| الدعم الفني | `/support/technical` | admin, technician |
| مدير الحساب | `/account-manager` | admin, owner, tenant |
| الخريطة التفاعلية للعقارات | `/map` | admin, owner |

## ملاحظات تقنية

- **الرسوم البيانية**: Recharts (KPI، Area، Bar، Pie) بأسلوب PowerBI.
- **الخريطة**: react-leaflet + OpenStreetMap (لا حاجة لمفتاح API).
- **تصدير PDF**: عبر أمر طباعة المتصفح (`window.print`) على صفحات مخصصة لعروض الأسعار والفواتير.
- **المصادقة**: `lib/auth-context.tsx` — Context + localStorage، بدون أمان حقيقي (نسخة تجريبية فقط).
- **البيانات**: مركزية في `lib/mock-data.ts`، وعروض الأسعار الجديدة تُحفظ في localStorage عبر `lib/quotes-store.ts`.

## الخطوات التالية لتحويله لنظام إنتاجي

- ربط قاعدة بيانات حقيقية (PostgreSQL/MySQL) بدلاً من `lib/mock-data.ts`.
- مصادقة حقيقية (NextAuth أو مشابه) مع صلاحيات فعلية للأدوار.
- توليد PDF من الخادم (مثل Puppeteer) بدلاً من طباعة المتصفح.
- تكامل PowerBI الفعلي (Power BI Embedded) بدلاً من الرسوم البيانية المحلية.
