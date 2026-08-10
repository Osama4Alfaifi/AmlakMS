# أملاك MS — نظام إدارة الأملاك (نسخة تجريبية)

منصة تجريبية شاملة لإدارة الأملاك مبنية بـ **Next.js + TypeScript + Tailwind CSS**، تعرض كل بوابات النظام
المطلوبة بواجهة عربية (RTL). **قاعدة بيانات حقيقية مشتركة** عبر **Firebase Firestore** تربط كل البوابات
ببعضها، و**مصادقة حقيقية** عبر **Firebase Authentication** — كل حساب له بريد وكلمة مرور فعليين، ويرى فقط
البيانات المخصصة له (مثلًا: تذكرة دعم يرفعها مستأجر تظهر له وللفريق المسؤول فقط، ليس لبقية المستأجرين
والملاك).

## التشغيل محليًا

يحتاج المشروع تشغيل **محاكيات Firebase المحلية (Firestore + Authentication)** — لا حاجة لإنشاء حساب أو
مشروع Firebase حقيقي في هذه المرحلة. يتطلب المحاكي **Java 21+** مثبتًا على الجهاز.

```bash
npm install

# طرفية 1: شغّل المحاكيات (تبقى تعمل في الخلفية)
npm run emulators

# طرفية 2: أنشئ حسابات Firebase Auth التجريبية + عبّئ قاعدة البيانات
npm run seed

# طرفية 3: شغّل التطبيق
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000). يمكنك أيضًا متابعة بيانات Firestore وحسابات
Authentication مباشرة عبر واجهة المحاكي على [http://localhost:4000](http://localhost:4000).

> بيانات المحاكي تُحفظ تلقائيًا عند الإيقاف وتُستعاد عند التشغيل التالي (`.firebase-emulator-data/`، غير
> مرفوعة على Git). لإعادة الضبط لحالتها الأصلية، احذف هذا المجلد ثم شغّل `npm run seed` من جديد.

### حسابات الدخول التجريبية

كل الحسابات تستخدم كلمة المرور **`demo1234`**. صفحة `/login` تعبّئ بريد حساب افتراضي تلقائيًا عند اختيار
الدور، ويمكنك أيضًا تجربة أي حساب آخر من القائمة (راجع مخرجات `npm run seed` للقائمة الكاملة):

| الدور | مثال بريد إلكتروني |
|---|---|
| مدير النظام | `admin@amlakms.sa` |
| مالك | بريد أول مالك في `lib/mock-data.ts` (`owners[0].email`) |
| مستأجر | بريد أول مستأجر (`tenants[0].email`) |
| فني صيانة | `tech-1@amlakms.sa` |

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
- **المصادقة**: Firebase Authentication (بريد/كلمة مرور) عبر `lib/auth-context.tsx`. دور كل حساب
  (admin/owner/tenant/technician) ومعرّف السجل المرتبط به (`linkedId`) مخزّنان في مستند
  `users/{uid}` في Firestore، وتُنشئهما `scripts/seed.ts` تلقائيًا لكل حساب تجريبي.
- **من يرى ماذا**: كل من التطبيق (`components/support/TicketBoard.tsx`, `app/quotes`, `app/reports`) *و*
  قواعد أمان Firestore (`firestore.rules`) يطبّقان نفس القاعدة بشكل مستقل — المرسل يرى ما أرسله فقط،
  والفريق المسؤول (المدير دائمًا، الفني لتذاكر الدعم الفني) يرى كل شيء في نطاقه. يعني هذا أن التقييد ليس
  مجرد إخفاء في الواجهة، بل مفروض فعليًا على مستوى قاعدة البيانات، فلا يمكن تجاوزه حتى بالوصول المباشر
  لـ Firestore.
- **استعلامات Firestore المقيّدة**: قاعدة أمان لعملية `list` يجب أن تكون صحيحة للاستعلام نفسه وليس لكل
  مستند على حدة — Firestore لا "يُصفّي" نتائج استعلام غير مقيّد، بل يقبله أو يرفضه بالكامل. لهذا `lib/firestore/hooks.ts`
  يوفّر خطافات مخصصة (`useMyMaintenanceRequests`, `useOwnerMaintenanceRequests`, `useSupportTicketsByCategory`)
  تستخدم `where()` مطابقة لشرط القاعدة، بدلاً من جلب المجموعة كاملة والتصفية في الواجهة.
- **الرسوم البيانية**: Recharts (KPI، Area، Bar، Pie) بأسلوب PowerBI.
- **الخريطة**: react-leaflet + OpenStreetMap (لا حاجة لمفتاح API).
- **تصدير PDF**: عبر أمر طباعة المتصفح (`window.print`) على صفحات مخصصة لعروض الأسعار والفواتير.

## قيود معروفة قبل الإنتاج الفعلي

- **عروض الأسعار**: قواعد Firestore تسمح لأي مالك بقراءة كل العروض (الواجهة فقط هي التي تُظهر له عروض
  عقاراته)، لأن العرض لا يخزّن معرّف العقار الفعلي (`propertyId`)، فقط عنوانًا نصيًا. يلزم إضافة هذا
  الحقل لفرض نفس التقييد على مستوى القاعدة أيضًا.
- **لا يوجد تسجيل حساب ذاتي (Sign-up)** — كل الحسابات تُنشأ حاليًا عبر `scripts/seed.ts` فقط.
- **توليد PDF** يعتمد على طباعة المتصفح، لا خادم مخصص (Puppeteer مثلًا) لتنسيق موحّد قابل للأرشفة.
- **تكامل PowerBI** الحالي هو رسوم بيانية محلية (Recharts) وليس Power BI Embedded الفعلي.
- عند الانتقال لمشروع Firebase حقيقي: انسخ القيم من Firebase Console إلى `.env.local` (راجع
  `.env.local.example`) وعيّن `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.
