# أملاك MS — نظام إدارة الأملاك (نسخة تجريبية)

منصة تجريبية شاملة لإدارة الأملاك مبنية بـ **Next.js + TypeScript + Tailwind CSS**، تعرض كل بوابات النظام
المطلوبة بواجهة عربية (RTL). **قاعدة بيانات حقيقية مشتركة** عبر **Firebase Firestore** تربط كل البوابات
ببعضها — فمثلًا تذكرة دعم يتم رفعها من حساب مستأجر تظهر فورًا لدى فريق الدعم، وطلب صيانة يظهر مباشرة لدى
الفني المختص. المصادقة حاليًا شكلية (اختيار الدور فقط من شاشة الدخول، بدون كلمة مرور حقيقية) — انظر قسم
"نحو نظام إنتاجي" أدناه لخطة تفعيل مصادقة حقيقية.

## التشغيل محليًا

يحتاج المشروع تشغيل **محاكي Firestore المحلي (Firebase Local Emulator)** — لا حاجة لإنشاء حساب أو مشروع
Firebase حقيقي في هذه المرحلة. يتطلب المحاكي **Java 21+** مثبتًا على الجهاز.

```bash
npm install

# طرفية 1: شغّل محاكي Firestore (يبقى يعمل في الخلفية)
npm run emulators

# طرفية 2: عبّئ قاعدة البيانات بالبيانات التجريبية (مرة واحدة فقط، أو بعد كل إعادة تشغيل للمحاكي)
npm run seed

# طرفية 3: شغّل التطبيق
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000). يمكنك أيضًا متابعة بيانات Firestore مباشرة عبر
واجهة المحاكي على [http://localhost:4000](http://localhost:4000).

> لإعادة ضبط البيانات إلى حالتها الأصلية بعد تجربة إنشاء/تعديل عناصر، أعد تشغيل `npm run seed` (يكتب فوق
> نفس السجلات بمعرّفاتها الأصلية).

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

## البنية التقنية

- **قاعدة البيانات**: Firebase Firestore — مشتركة بين كل البوابات، تحديثات لحظية (`onSnapshot`) عبر
  `lib/firestore/hooks.ts`، وعمليات الإنشاء/التعديل عبر `lib/firestore/mutations.ts`.
- **البيانات الأولية (Seed)**: `lib/mock-data.ts` يبقى مصدر البيانات التجريبية، ويُستخدم فقط بواسطة
  `scripts/seed.ts` لتعبئة Firestore — الصفحات نفسها لا تقرأ منه مباشرة بعد الآن (باستثناء دالة `currency`
  المساعدة والبيانات التوضيحية الثابتة مثل `monthlyRevenue`).
- **الرسوم البيانية**: Recharts (KPI، Area، Bar، Pie) بأسلوب PowerBI.
- **الخريطة**: react-leaflet + OpenStreetMap (لا حاجة لمفتاح API).
- **تصدير PDF**: عبر أمر طباعة المتصفح (`window.print`) على صفحات مخصصة لعروض الأسعار والفواتير، تقرأ
  بيانات حية من Firestore حسب المعرّف في الرابط.
- **المصادقة**: `lib/auth-context.tsx` — Context + localStorage لتذكر الدور المختار فقط، **بدون أمان
  حقيقي**. قواعد Firestore الحالية (`firestore.rules`) مفتوحة بالكامل للقراءة/الكتابة لتلائم هذه المرحلة.

## نحو نظام إنتاجي

1. **إنشاء مشروع Firebase حقيقي** من [console.firebase.google.com](https://console.firebase.google.com)،
   ثم نسخ القيم إلى `.env.local` (راجع `.env.local.example`) وتعيين `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.
2. **تفعيل Firebase Authentication** الحقيقي (بريد/كلمة مرور أو حسب الحاجة) بدل الدخول الشكلي الحالي، وربط
   كل مستخدم بمستند `users/{uid}` يحمل دوره.
3. **تشديد قواعد الأمان**: استبدال `firestore.rules` بنسخة مشابهة لـ `firestore.prod.rules.example`
   المرفقة (تتحقق من هوية المستخدم ودوره قبل القراءة/الكتابة).
4. **توليد PDF من الخادم** (مثل Puppeteer) بدلاً من طباعة المتصفح، للحصول على تنسيق موحّد قابل للأرشفة.
5. **تكامل PowerBI الفعلي** (Power BI Embedded) بدلاً من الرسوم البيانية المحلية إن كان مطلوبًا.
