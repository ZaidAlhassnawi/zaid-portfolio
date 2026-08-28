# Zaid Hani Alhasnawi - Dynamic Portfolio

نسخة مستقلة من Portfolio احترافي متصل بـ Supabase، وتتضمن:

- واجهة عامة باللغة الإنجليزية ومتجاوبة مع الهاتف.
- تحميل الملف الشخصي والمهارات والمشاريع والخبرة والتعليم والشهادات وروابط التواصل من قاعدة البيانات.
- تسجيل دخول المدير بواسطة Supabase Auth.
- استعادة كلمة مرور المدير عبر البريد من دون حذف الحساب.
- لوحة لإضافة وتعديل وحذف المشاريع والمهارات والشهادات.
- ربط المهارات بالمشاريع.
- رفع ملفات الشهادات إلى Supabase Storage من صفحة الإضافة.
- جاهزية للنشر على GitHub Pages.

## 1. إعداد الاتصال

افتح الملف:

`assets/js/config.js`

ثم ضع Project URL ومفتاح `Publishable key` أو `anon key`:

```js
export const SUPABASE_CONFIG = Object.freeze({
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "YOUR_PUBLISHABLE_KEY",
  storageBucket: "portfolio-assets",
});
```

استخدم المفتاح العام فقط. لا تستخدم مطلقًا:

- `service_role`
- كلمة مرور PostgreSQL
- Connection string

وجود المفتاح العام في مستودع GitHub أمر طبيعي؛ الحماية تعتمد على RLS وليس على إخفاء هذا المفتاح.

## 2. التشغيل على الجهاز

لا تفتح `index.html` بالنقر المزدوج لأن ملفات JavaScript تستخدم ES Modules. شغّل خادمًا محليًا بإحدى الطريقتين:

### VS Code

ثبّت إضافة Live Server، ثم اضغط بزر الفأرة الأيمن على `index.html` واختر `Open with Live Server`.

### Python

من داخل مجلد المشروع:

```bash
python -m http.server 5500
```

ثم افتح:

`http://localhost:5500`

لوحة الإدارة:

`http://localhost:5500/admin/login.html`

استعادة كلمة المرور:

`http://localhost:5500/admin/reset-password.html`

## 3. الحماية المطلوبة في Supabase

قبل النشر تأكد من الآتي:

1. تعطيل Public Sign-ups في Supabase Auth.
2. وجود حساب مدير واحد فقط.
3. تفعيل RLS على كل الجداول العامة.
4. السماح للزوار بعملية `SELECT` على الصفوف المرئية فقط.
5. السماح بـ `INSERT / UPDATE / DELETE` للمستخدم المسجل والمصرح له فقط.
6. بقاء bucket باسم `portfolio-assets` عامًا للقراءة فقط.
7. اقتصار الرفع والتعديل والحذف في Storage على مسار يبدأ بـ User ID الخاص بالمستخدم.
8. عدم وضع `service_role` أو Database Password في المشروع أو GitHub.

يمكن تشغيل `sql/security-audit.sql` في SQL Editor لفحص RLS والسياسات دون تغيير البيانات.

## 4. طريقة عمل لوحة الإدارة

- `admin/login.html`: يرسل البريد وكلمة المرور مباشرة إلى Supabase Auth عبر HTTPS.
- Supabase يعيد جلسة قصيرة الأجل ويجددها تلقائيًا.
- `admin/dashboard.html`: يتحقق من وجود الجلسة قبل عرض البيانات.
- `admin/reset-password.html`: يرسل رابط الاستعادة ويتيح تعيين كلمة مرور جديدة بعد التحقق من الرابط.
- كل عملية تعديل تصل إلى Supabase وتخضع لسياسات RLS مرة أخرى.
- إخفاء رابط لوحة الإدارة ليس وسيلة حماية؛ RLS هي حاجز الحماية الحقيقي.

## 5. رفع شهادة

من Dashboard اختر Certificates ثم Add certificate. عند اختيار ملف:

- يقبل JPEG وPNG وWEBP وPDF فقط.
- الحد الأقصى 5 MB.
- يُرفع إلى المسار:

```text
USER_ID/certificates/unique-file-name.pdf
```

- يُحفظ المسار في `certificates.image_path`.

## 6. النشر على GitHub Pages

1. أنشئ Repository جديدًا مثل `zaid-portfolio`.
2. ارفع محتويات هذا المجلد إلى الفرع `main`.
3. افتح Settings ثم Pages.
4. اختر `Deploy from a branch`.
5. اختر `main` والمجلد `/root`.
6. احفظ وانتظر ظهور رابط الموقع.

بعدها أضف رابط GitHub Pages إلى Supabase ضمن إعدادات Auth المسموح بها إذا استخدمت روابط إعادة توجيه مستقبلًا. تسجيل الدخول بالبريد وكلمة المرور في النسخة الحالية لا يحتاج Redirect خارجيًا.

## 7. الملفات الأساسية

```text
index.html                    الواجهة العامة
admin/login.html              تسجيل دخول المدير
admin/dashboard.html          لوحة الإدارة
admin/reset-password.html     طلب الاستعادة وتعيين كلمة مرور جديدة
assets/js/config.js           إعدادات الاتصال العامة
assets/js/supabase-client.js  إنشاء عميل Supabase
assets/js/portfolio.js        قراءة وعرض البيانات العامة
assets/js/login.js            تسجيل الدخول
assets/js/reset-password.js   استعادة كلمة المرور
assets/js/dashboard.js        CRUD ورفع الشهادات
assets/css/main.css           تصميم الموقع العام
assets/css/admin.css          تصميم لوحة الإدارة
sql/security-audit.sql        تدقيق أمان للقراءة فقط
```

## ملاحظة مهمة

لوحة الإدارة الحالية تدير العناصر المطلوبة: Projects وSkills وCertificates. بقية أقسام الملف الشخصي تُقرأ من قاعدة البيانات، ويمكن إضافة نماذج إدارتها لاحقًا بنفس النمط.
