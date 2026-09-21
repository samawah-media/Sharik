# تسليم تجربة المالك — 2026-08-04

الحالة: `X010_B7_READY_FOR_OWNER_TRIAL`.

## رابط التجربة

`https://shrik-git-codex-015-persistent-mvp-pil-cbe689-samawahs-projects.vercel.app`

هذا Preview محمي تحت مشروع `samawahs-projects/shrik`، وليس Production. افتحه
بحساب Vercel المصرح له، ثم سجّل دخول المنصة ببيانات الشخصيات الموجودة محليًا في
`.env.s015-team-uat.local`. لا تنسخ كلمات المرور إلى Git أو المحادثات.

## الحسابات المطلوبة

- الإدارة: `S015_UAT_ADMIN_EMAIL` / `S015_UAT_ADMIN_PASSWORD`
- مدير الحساب: `S015_UAT_ACCOUNT_MANAGER_EMAIL` / `S015_UAT_ACCOUNT_MANAGER_PASSWORD`
- الكاتب المسند: `S015_UAT_WRITER_EMAIL` / `S015_UAT_WRITER_PASSWORD`
- المصمم المسند: `S015_UAT_DESIGNER_EMAIL` / `S015_UAT_DESIGNER_PASSWORD`
- عضو غير مسند (اختبار المنع): `S015_UAT_UNASSIGNED_EMAIL` / `S015_UAT_UNASSIGNED_PASSWORD`
- العميل المشاهد: `S015_UAT_CLIENT_VIEWER_EMAIL` / `S015_UAT_CLIENT_VIEWER_PASSWORD`
- العميل المعتمد: `S015_UAT_CLIENT_APPROVER_EMAIL` / `S015_UAT_CLIENT_APPROVER_PASSWORD`

استخدم نافذة خاصة مختلفة لكل دور، أو سجّل الخروج قبل الانتقال إلى الدور التالي.

## ما تم إثباته آليًا

- migrations على UAT متطابقة حتى `202608040001`.
- الشخصيات والمسارات والعزل: 27/27 على desktop/mobile/RTL.
- دورة العمل الكاملة: 1/1، run ID `s015-hosted-lifecycle-c9ca31d742`، وانتهت
  `delivered`.
- عنصر مراجعة المالك: run ID `s015-owner-trial-e54d621cfe`، وحالته
  `waiting_client_approval`.
- لا يستطيع المشاهد اتخاذ قرار، بينما يستطيع المعتمد الاعتماد أو طلب التعديل.
- لا تظهر المهام أو الجودة أو التعليقات أو الملفات الداخلية للعميل.

## دور المالك الآن

اتبع بالترتيب
[`owner-acceptance-walkthrough-ar.md`](owner-acceptance-walkthrough-ar.md)، وسجّل
لكل منظور `PASS` أو `FAIL` مع صورة عند الفشل. لا تستخدم بيانات عميل حقيقي في
هذه الجولة. إذا ظهر P0 أو P1 فتوقف؛ وإذا مرّت الإدارة والفريق والمشاهد والمعتمد
بسهولة، أرسل عبارة: `OWNER UAT PASS` مع أي ملاحظات P2/P3.

## الحدود

هذه الجاهزية لتجربة المالك فقط. لا merge، لا Production، لا public signup، ولا
دعوة عميل خارجي قبل PASS صريح.
