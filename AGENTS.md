# AGENTS.md — دليل إلزامي لأي وكيل أو مطور يعمل على منصة سماوة

**المشروع:** منصة سماوة لإدارة المخرجات التسويقية والتعميدات وSLA بين العميل، فريق سماوة، والإدارة  
**الإصدار:** v1.0 — ملف توجيه الوكلاء  
**تاريخ الإنشاء:** 2026-06-15  
**مكان الاستخدام المقترح:** انسخ هذا الملف إلى جذر الريبو باسم `AGENTS.md`، ويجب على أي وكيل AI أو مطور قراءته قبل التخطيط أو كتابة أي كود.

\---

## 0\. سلطة هذا الملف

هذا الملف هو المرجع الإلزامي الأعلى داخل مشروع سماوة بعد قرارات الإدارة والمالك.  
أي وكيل أو مطور أو أداة ذكاء اصطناعي تعمل على المشروع يجب أن تلتزم به.

### قواعد إلزامية

1. **لا تبدأ كود قبل وجود Spec واضح.**
2. **لا تضف تقنية جديدة بدون ADR.**
3. **لا تكشف تعليقات فريق سماوة الداخلية للعميل.**
4. **لا تنشئ Query أو API أو RLS Policy بدون احترام tenant/client isolation.**
5. **لا يوجد اعتماد أو رفض أو طلب تعديل بدون Audit Log.**
6. **لا يوجد SLA بدون حالة توقف عند انتظار العميل.**
7. **لا تستخدم BrightBean أو Postiz أو Planka كقاعدة بناء مباشرة في V1.**

إذا تعارض طلب مؤقت من وكيل مع هذا الملف، يجب إيقاف التنفيذ وطلب تأكيد صريح من صاحب المشروع.

\---

## 1\. تعريف المنتج الذي يجب أن يفهمه أي وكيل

منصة سماوة ليست نظام طلبات تقليديًا، وليست منصة جدولة منشورات سوشيال في الإصدار الأول.  
هي منصة تشغيل وتسليم داخلية/خارجية لإدارة **المخرجات التسويقية المتفق عليها** بين ثلاثة أطراف:

1. **العميل**
2. **فريق سماوة**
3. **الإدارة / مدير المشروع / مدير التسويق**

### التعريف المختصر

> منصة سماوة هي Automation Bridge لإدارة المخرجات التسويقية المتفق عليها مع العملاء، تربط العميل وفريق العمل والإدارة، وتدير التنفيذ، الملفات، التعليقات، التعميد الداخلي، اعتماد العميل، SLA، والتسليم النهائي من خلال واجهات بسيطة ومخصصة لكل دور.

### ما هي المنصة؟

* نظام لإدارة المخرجات والتسليمات.
* نظام لتتبع تقدم العمل.
* نظام لتوثيق التعميدات الداخلية واعتمادات العميل.
* نظام SLA من الإصدار الأول.
* نظام ملفات مرتبط بالعميل والعقد والمخرج.
* نظام Kanban/Trello داخلي لفريق سماوة والإدارة.
* بوابة عميل مبسطة لمعرفة: ما تم، ما تبقى، ما ينتظر موافقته، وما تم تسليمه.

### ما ليست المنصة في V1؟

* ليست Helpdesk أو Ticketing System.
* ليست CRM كامل.
* ليست ERP.
* ليست منصة جدولة سوشيال الآن.
* ليست بديلًا مباشرًا لـ BrightBean أو Buffer أو Hootsuite.
* ليست منصة محاسبة وفوترة متقدمة في V1.
* ليست منصة AI Content Generation في V1.

\---

## 2\. قلب V1 غير القابل للتغيير

قلب الإصدار الأول يجب أن يبقى:

```text
المخرجات المتفق عليها
+ SLA
+ لوحة العمل الداخلية Kanban/Trello
+ التعميد الداخلي
+ اعتماد العميل
+ الملفات
+ الصلاحيات
+ تعدد العملاء
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/006-ux-rescue-product-shell/plan.md
<!-- SPECKIT END -->

أي اقتراح لا يخدم هذه العناصر يجب تأجيله أو توثيقه كخارج نطاق V1.

\---

## 3\. الأطراف وتجارب الاستخدام

### 3.1 العميل

العميل يجب أن يرى تجربة بسيطة جدًا، ولا يرى تعقيد العمل الداخلي.

يرى العميل:

* الرئيسية.
* بانتظار موافقتي.
* العقد والمتابعة.
* الملفات.
* الإعدادات.
* المخرجات المرتبطة به فقط.
* حالته وتقدمه ومتبقي الباقة.
* الملفات النهائية والمرفقات المسموح بها.
* التعليقات الموجهة له فقط.

لا يرى العميل:

* تعليقات الفريق الداخلية.
* ملاحظات الجودة الداخلية.
* أخطاء النسخ السابقة غير المرسلة له.
* لوحات عمل العملاء الآخرين.
* عقود أو ملفات العملاء الآخرين.
* صلاحيات الإدارة الداخلية.

### 3.2 فريق سماوة

يشمل:

* أخصائي تسويق.
* كاتب محتوى.
* مصمم.
* موشن جرافيك.
* ناشر محتوى.
* محلل أداء.
* مدير حساب حسب الصلاحية.

يرى الفريق:

* مهامه.
* لوحة العمل الداخلية.
* المخرجات المسندة له.
* ملفات العميل اللازمة للعمل.
* التعليقات الداخلية.
* الملاحظات من الإدارة.
* SLA الخاص بالمهام والمخرجات.

لا يستطيع الفريق افتراضيًا:

* إرسال العمل للعميل مباشرة.
* اعتماد نهائي.
* تعديل العقد.
* حذف مخرج رئيسي.
* رؤية ملفات أو مخرجات غير مصرح له بها.

### 3.3 الإدارة / مدير المشروع / مدير التسويق

يرى الإدارة:

* كل العملاء المصرح بهم.
* كل المخرجات.
* تأخيرات SLA.
* ما ينتظر الفريق.
* ما ينتظر الإدارة.
* ما ينتظر العميل.
* أداء الفريق.
* جودة التسليم.
* التقارير الإدارية.

تستطيع الإدارة:

* إنشاء العملاء والعقود والباقات.
* إضافة المخرجات المتفق عليها.
* توزيع المهام.
* مراجعة الجودة.
* التعميد الداخلي.
* إرسال المخرج للعميل.
* إغلاق المخرج.
* إعادة فتح المخرج عند الحاجة.
* تعديل SLA وفق صلاحيات محددة.

\---

## 4\. نموذج التشغيل الإلزامي

يجب أن يعمل النظام حسب التسلسل الآتي:

```text
1. يتم الاتفاق مع العميل خارج أو داخل المنصة.
2. فريق سماوة أو الإدارة يضيف العميل والعقد/الباقة.
3. فريق سماوة أو الإدارة يضيف المخرجات المتفق عليها.
4. كل مخرج يأخذ تواريخ ومسؤولين وSLA وحالة.
5. فريق العمل ينفذ داخل Kanban داخلي.
6. فريق العمل يرفع العمل أو النسخة.
7. الإدارة تراجع وتطلب تعديلًا داخليًا أو تعمد داخليًا.
8. بعد التعميد الداخلي فقط يتم إرسال المخرج للعميل.
9. العميل يعتمد أو يطلب تعديلًا.
10. عند الاعتماد النهائي يتم تسليم المخرج وإغلاقه.
11. يتم احتساب المخرج ضمن العقد/الباقة.
12. يتم حفظ Audit Log لكل خطوة.
```

### ملاحظة حاسمة

لا يجب أن يرى العميل أي مخرج قبل التعميد الداخلي، إلا إذا قررت الإدارة خلاف ذلك بصلاحية واضحة.

\---

## 5\. نظام المخرجات المرن

يجب بناء المنصة حول كيان أساسي اسمه:

```text
Deliverable / المخرج / التسليمة
```

المخرج يمكن أن يكون:

* منشور.
* Reel.
* Story.
* تقرير.
* خطة محتوى.
* تصميم.
* فيديو.
* حملة.
* مقال.
* صفحة هبوط.
* اجتماع.
* استشارة.
* أي خدمة مستقبلية.

### الحقول الأساسية للمخرج

كل مخرج يجب أن يدعم على الأقل:

```text
id
client\_id / tenant\_id
contract\_id أو package\_id اختياري
name
description
type
status
priority
owner\_id
contributors\[]
start\_date
internal\_due\_date
client\_due\_date
final\_due\_date
sla\_status
progress\_percentage
requires\_internal\_approval
requires\_client\_approval
current\_version\_id
created\_by
created\_at
updated\_at
closed\_at
```

### حالات المخرج الأساسية

```text
not\_started
in\_progress
ready\_for\_internal\_review
internal\_changes\_requested
internally\_approved
waiting\_client\_approval
client\_changes\_requested
client\_approved
ready\_for\_delivery
delivered
cancelled
archived
```

### حساب التقدم المقترح

```text
not\_started = 0%
in\_progress = 30%
ready\_for\_internal\_review = 50%
internal\_changes\_requested = 45%
internally\_approved = 70%
waiting\_client\_approval = 80%
client\_changes\_requested = 65%
client\_approved = 90%
ready\_for\_delivery = 95%
delivered = 100%
```

لا تعتمد فقط على نسبة يدوية. يجب أن تكون هناك علاقة بين الحالة والتقدم.

\---

## 6\. SLA من الإصدار الأول

SLA ليس ميزة لاحقة. يجب أن يكون حاضرًا في V1 بشكل مبسط وعملي.

### حالات SLA الأساسية

```text
on\_track
at\_risk
overdue
paused\_waiting\_client
paused\_waiting\_internal\_decision
completed
cancelled
```

### قواعد إلزامية لـ SLA

1. يبدأ SLA عند تفعيل المخرج أو بدء العمل.
2. يتوقف SLA إذا أصبح المخرج بانتظار اعتماد العميل.
3. لا يتم احتساب تأخير العميل على فريق سماوة.
4. يستأنف SLA عند طلب العميل تعديلًا أو عند عودة المخرج للفريق.
5. يجب تسجيل سبب التوقف والاستئناف في Audit Log.
6. يجب أن تظهر حالة SLA في لوحة الإدارة ولوحة المخرج.

### مثال حاسم

إذا تم إرسال مخرج للعميل يوم 10 يوليو، وتأخر العميل 4 أيام في الموافقة، لا يظهر أن سماوة متأخرة.  
الحالة تكون:

```text
paused\_waiting\_client
```

ويتم احتساب وقت الانتظار على العميل في التقارير.

\---

## 7\. التعميد الداخلي واعتماد العميل

### 7.1 التعميد الداخلي

يحدث قبل ظهور المخرج للعميل.

المسار:

```text
فريق العمل يرفع نسخة
↓
جاهز للمراجعة الداخلية
↓
الإدارة تراجع
↓
إما تطلب تعديلًا داخليًا
أو تعتمد داخليًا
↓
بعد التعميد الداخلي يمكن إرساله للعميل
```

يجب أن يدعم التعميد الداخلي:

* رفع نسخة.
* تعليق داخلي.
* Checklist جودة.
* طلب تعديل.
* إعادة رفع نسخة.
* اعتماد داخلي.
* Audit Log.

### 7.2 اعتماد العميل

يحدث بعد التعميد الداخلي.

المسار:

```text
internally\_approved
↓
waiting\_client\_approval
↓
العميل يعتمد أو يطلب تعديلًا
↓
client\_approved أو client\_changes\_requested
```

يجب أن يدعم اعتماد العميل:

* اعتماد.
* طلب تعديل.
* تعليق.
* مشاهدة النسخة المرسلة له فقط.
* سجل قرار: من وافق؟ متى؟ على أي نسخة؟
* منع العميل من رؤية التعليقات الداخلية.

\---

## 8\. لوحة العمل Kanban / Trello

لوحة Kanban داخلية لفريق سماوة والإدارة، وليست الواجهة الرئيسية للعميل.

### الأعمدة المقترحة

```text
لم يبدأ
قيد التنفيذ
جاهز للمراجعة الداخلية
يحتاج تعديل داخلي
معتمد داخليًا
بانتظار اعتماد العميل
يحتاج تعديل من العميل
معتمد من العميل
تم التسليم
```

### قواعد Drag \& Drop

1. لا يسمح بسحب كارت إلى `waiting\_client\_approval` إلا إذا كان `internally\_approved`.
2. لا يسمح بسحب كارت إلى `delivered` إلا إذا كان `client\_approved` أو لا يحتاج اعتماد عميل.
3. أي تغيير حالة يجب أن يسجل Audit Log.
4. أي حركة قد تؤثر على SLA يجب أن تحدث SLA تلقائيًا.
5. تحريك الكروت يجب أن يكون Optimistic UI مع rollback عند فشل الحفظ.

### المكتبة المعتمدة

```text
dnd-kit
```

لا تستخدم Planka كقاعدة مباشرة. يمكن الاستلهام من تجربة Planka فقط بعد مراجعة الترخيص وعدم نسخ الكود.

\---

## 9\. الملفات والتسليمات

الملفات ليست تخزينًا عامًا فقط. كل ملف يجب أن يرتبط بسياق واضح.

### كل ملف يجب أن يحتوي

```text
id
tenant\_id
client\_id
owner\_user\_id
related\_deliverable\_id optional
related\_contract\_id optional
visibility
file\_type
file\_size
storage\_path
version\_number
is\_final
created\_at
```

### أنواع الرؤية

```text
internal\_only
client\_visible
client\_uploaded
final\_delivery
contract\_file
report\_file
brand\_asset
```

### قواعد إلزامية

1. الملفات الداخلية لا تظهر للعميل.
2. الملفات النهائية تظهر للعميل بعد اعتماد الإدارة.
3. الملفات المرتبطة بتعليقات داخلية لا تظهر للعميل.
4. أي تنزيل ملف يجب أن يحترم tenant\_id وpermission.
5. يجب دعم نسخ الملفات أو versioning على الأقل بشكل بسيط.

### المكتبة المعتمدة للرفع

```text
Uppy + Supabase Storage
```

إذا كبرت أحجام الفيديو أو الملفات، يسمح باقتراح Cloudflare R2 عبر ADR.

\---

## 10\. التعليقات

### أنواع التعليقات

```text
internal\_comment
client\_comment
system\_comment
approval\_comment
```

### قواعد الرؤية

* `internal\_comment`: فريق سماوة والإدارة فقط.
* `client\_comment`: العميل + الإدارة + الفريق المصرح له.
* `system\_comment`: يظهر حسب السياق.
* `approval\_comment`: يظهر في سجل الاعتماد حسب نوع الاعتماد.

### محرر التعليقات

الاختيار الأساسي:

```text
Tiptap
```

يسمح بتبسيط البداية إلى Markdown/textarea إذا كان ذلك أسرع، لكن يجب توثيق القرار في ADR إذا تم التخلي عن Tiptap.

\---

## 11\. الصلاحيات وتعدد العملاء

### قاعدة إلزامية

```text
كل عميل = tenant أو client scope مستقل منطقيًا.
```

لا يجوز أن يرى عميل بيانات عميل آخر.

### أدوار أولية

```text
samawah\_admin
project\_manager
marketing\_manager
account\_manager
content\_writer
designer
performance\_specialist
client\_admin
client\_approver
client\_viewer
```

### قاعدة RLS إلزامية

كل جدول يحتوي بيانات عميل يجب أن يحتوي على:

```text
tenant\_id أو client\_id
```

ويجب تطبيق RLS Policy أو تحقق server-side يمنع الوصول خارج النطاق.

### لا Query بدون Tenant

أي Query على:

* clients
* contracts
* deliverables
* tasks
* files
* comments
* approvals
* audit\_logs

يجب أن يحتوي على شرط tenant/client scope أو يعتمد على RLS موثقة.

\---

## 12\. الـ Stack المعتمد للتخطيط

يجب استخدام الحزمة التالية في مراحل التخطيط والتوثيق:

```text
Product Manager Skills
BMAD Method
GitHub Spec Kit
Agent OS
C4 + arc42 + ADR
AWS/Azure Multitenant Guidance
OWASP ASVS
Shape Up
```

### استخدام كل إطار

|الإطار|الاستخدام الإلزامي|
|-|-|
|Product Manager Skills|PRD، personas، user stories، roadmap، success metrics|
|BMAD Method|جلسات Analyst/PM/UX/Architect/QA لمراجعة القرارات|
|GitHub Spec Kit|كل Feature يجب أن يكون لها `spec.md`, `plan.md`, `tasks.md`|
|Agent OS|تثبيت standards المشروع وأسلوب عمل الوكلاء|
|C4|رسم Context وContainer للمعمارية|
|arc42|توثيق المعمارية بشكل منظم|
|ADR|أي قرار تقني أو معماري مهم|
|AWS/Azure Multitenant Guidance|مرجع لتعدد العملاء وعزل البيانات|
|OWASP ASVS|Checklist أمان قبل التنفيذ والإطلاق|
|Shape Up|تقسيم التنفيذ إلى دورات مركزة|

### أدوات مساعدة فقط

```text
Lean Canvas: جلسة واحدة في البداية
JTBD: جلسة واحدة لفهم دوافع العميل
SuperClaude: اختياري إذا كان فريق التطوير يستخدم Claude Code
Opportunity Solution Tree: لاحقًا بعد تجربة أول عملاء
```

\---

## 13\. الـ Stack المعتمد للتصميم والتنفيذ

### Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Lucide Icons
```

### Backend \& Database

```text
Supabase
PostgreSQL
Row Level Security RLS
Supabase Auth
Supabase Storage
Server Actions أو Edge Functions للمنطق الحساس
```

### State/Data/UI Tables

```text
TanStack Query
TanStack Table
```

### Kanban

```text
dnd-kit
```

### Forms \& Validation

```text
Zod
React Hook Form
```

### Files

```text
Uppy
Supabase Storage
Cloudflare R2 لاحقًا عند الحاجة وبعد ADR
```

### Comments/Editor

```text
Tiptap
Markdown fallback only via ADR
```

### Calendar/Timeline

```text
Custom Timeline for V1
FullCalendar لاحقًا فقط عند الحاجة لتقويم متقدم
```

### Testing

```text
Vitest
Playwright
Testing Library
OWASP ASVS checklist
Manual QA scenarios
```

\---

## 14\. أدوات ومشاريع مرجعية فقط، وليست قواعد بناء في V1

### BrightBean

يستخدم كمرجع UX ووظائف للآتي:

```text
approval workflow
client portal
media library
calendar
audit trail
```

لا تستخدم BrightBean كقاعدة مباشرة في V1.  
لا تنسخ الكود أو الواجهة حرفيًا.  
أي استخدام مباشر يتطلب مراجعة الترخيص وADR وموافقة صريحة.

### Mixpost

مرجع مهم للمرحلة الثانية الخاصة بالجدولة الاجتماعية.  
يمكن دراسته لاحقًا إذا قررنا إضافة social scheduling.

### Postiz

مرجع معماري قوي للجدولة.  
لا يستخدم كقاعدة مباشرة قبل حسم الترخيص والمخاطر.

### Planka

مرجع UX للـ Kanban فقط.  
لا يستخدم كقاعدة مباشرة بسبب حساسية الترخيص وعدم وضوح ملاءمته التجارية.

\---

## 15\. أشياء ممنوعة أو مؤجلة في V1

### ممنوع في V1 بدون موافقة وADR

```text
BrightBean as base code
Postiz as base code
Planka as base code
Microservices architecture
Full NestJS backend
Direct social publishing
AI content generation
Complex CRM
Advanced billing
Mobile apps
Public marketplace
```

### مؤجل لما بعد V1

```text
Social scheduling
BrightBean/Mixpost/Postiz integration
Advanced analytics
WhatsApp automation
Advanced reports
AI suggestions
Calendar-heavy content planning
Billing/subscriptions
Mobile app
```

\---

## 16\. هيكل الملفات الإلزامي داخل الريبو

ينبغي أن يكون مجلد `docs` بهذا الشكل:

```text
docs/
  00-product/
    product-vision.md
    prd.md
    personas.md
    jobs-to-be-done.md
    roadmap.md

  01-core-model/
    deliverables-model.md
    contracts-and-packages.md
    sla-model.md
    approval-workflow.md
    progress-calculation.md

  02-users-and-permissions/
    roles-and-permissions.md
    client-portal-permissions.md
    team-workspace-permissions.md
    admin-permissions.md

  03-ux/
    information-architecture.md
    client-user-flow.md
    team-user-flow.md
    admin-user-flow.md
    kanban-ux.md
    files-ux.md

  04-architecture/
    c4-context.md
    c4-containers.md
    arc42.md
    data-model.md
    rls-policy-matrix.md
    integration-map.md

  05-decisions/
    ADR-001-deliverables-core.md
    ADR-002-supabase.md
    ADR-003-kanban-dnd-kit.md
    ADR-004-scheduling-later.md
    ADR-005-sla-waiting-client.md

  06-security/
    owasp-asvs-v1-checklist.md
    tenant-isolation.md
    file-access-control.md
    audit-log-policy.md

  07-delivery/
    cycles.md
    milestones.md
    acceptance-tests.md
    release-checklist.md
```

### هيكل Features باستخدام Spec Kit

```text
features/
  deliverables/
    spec.md
    plan.md
    tasks.md

  sla/
    spec.md
    plan.md
    tasks.md

  kanban-board/
    spec.md
    plan.md
    tasks.md

  internal-approvals/
    spec.md
    plan.md
    tasks.md

  client-approvals/
    spec.md
    plan.md
    tasks.md

  files/
    spec.md
    plan.md
    tasks.md

  roles-permissions/
    spec.md
    plan.md
    tasks.md

  client-portal/
    spec.md
    plan.md
    tasks.md

  admin-dashboard/
    spec.md
    plan.md
    tasks.md
```

\---

## 17\. دورات التنفيذ باستخدام Shape Up

يجب تقسيم التنفيذ إلى دورات واضحة لا إلى Backlog عشوائي.

### Cycle 1 — الأساس

```text
Auth
Organizations / tenants
Users
Roles
Permissions
Basic RLS
Audit log foundation
```

### Cycle 2 — العملاء والعقود والمخرجات

```text
Clients
Contracts
Packages
Deliverable types
Deliverable creation
Deliverable templates
Progress calculation
```

### Cycle 3 — SLA

```text
SLA fields
SLA status calculation
Pause/resume logic
Waiting client state
At-risk/overdue states
SLA dashboard indicators
```

### Cycle 4 — Kanban والتعليقات الداخلية

```text
Kanban board
Cards
Drag/drop
Internal comments
Assignments
Status transitions
```

### Cycle 5 — التعميد الداخلي واعتماد العميل

```text
Internal review
Internal approval
Client approval portal
Change requests
Approval logs
Visibility separation
```

### Cycle 6 — الملفات والتسليمات

```text
File uploads
File permissions
Versioning
Final deliverables
Download/view permissions
```

### Cycle 7 — لوحات المتابعة والتقارير المبسطة

```text
Client dashboard
Admin dashboard
Team dashboard
Deliverables summaries
SLA summaries
Contract progress
```

### Cycle 8 — الاختبارات والتجربة

```text
Unit tests
E2E tests
Security checklist
Pilot with current clients
Bug fixes
Release checklist
```

\---

## 18\. Quality Gates قبل أي Merge أو تسليم

أي Feature لا تكتمل إلا بعد عبور البوابات التالية:

### Product Gate

* هل تخدم قلب V1؟
* هل هي مرتبطة بالمخرجات أو SLA أو التعميد أو الملفات أو الصلاحيات؟
* هل العميل أو الفريق أو الإدارة سيستفيد منها؟

### Spec Gate

* يوجد `spec.md`.
* يوجد `plan.md`.
* يوجد `tasks.md`.
* يوجد Acceptance Criteria.
* تم تحديد Out of Scope.

### Architecture Gate

* تم تحديد الجداول والعلاقات.
* تم تحديد tenant\_id/client\_id.
* تم تحديد RLS أو صلاحيات الوصول.
* إذا تغيرت المعمارية، يوجد ADR.

### Security Gate

* لا توجد بيانات عميل يمكن الوصول لها من عميل آخر.
* لا تظهر تعليقات داخلية للعميل.
* الملفات محمية.
* روابط الاعتماد محمية.
* يوجد Audit Log.

### Implementation Gate

* TypeScript strict قدر الإمكان.
* Zod validation للمدخلات.
* React Hook Form للفورمات.
* TanStack Query للبيانات المتزامنة.
* لا استعلامات مباشرة بدون tenant scope.

### Testing Gate

* Unit tests للمنطق الحساس.
* E2E للرحلة الأساسية.
* اختبار صلاحيات.
* اختبار tenant isolation.
* اختبار SLA pause/resume.
* اختبار أن العميل لا يرى internal comments.

\---

## 19\. اختبارات إلزامية في V1

يجب تغطية هذه السيناريوهات على الأقل:

### Tenant isolation

```text
Client A cannot see Client B deliverables.
Client A cannot download Client B files.
Client A cannot access Client B approval links.
```

### Roles \& permissions

```text
Content writer cannot approve internally.
Designer cannot send directly to client.
Client viewer cannot approve.
Client approver can approve assigned deliverables.
Admin can see all allowed clients.
```

### SLA

```text
SLA starts when deliverable starts.
SLA pauses when waiting for client.
SLA resumes when client requests changes.
SLA marks overdue correctly.
SLA does not count client waiting time against Samawah.
```

### Approvals

```text
Deliverable cannot be sent to client before internal approval.
Internal approval creates audit log.
Client approval creates audit log.
Client change request returns deliverable to proper status.
```

### Files

```text
Internal file is invisible to client.
Final file is visible after delivery.
Client-uploaded file is visible to authorized team.
File download requires permission.
```

### Comments

```text
Internal comment is hidden from client.
Client comment is visible to authorized Samawah team.
System comment records state changes.
```

\---

## 20\. طريقة عمل أي وكيل AI على المشروع

أي وكيل يجب أن يتبع هذه الخطوات بالترتيب:

```text
1. اقرأ AGENTS.md.
2. اقرأ ملفات docs المرتبطة بالمهمة.
3. حدد هل المهمة Product / Spec / Architecture / Code / QA.
4. تحقق أن المهمة داخل V1 أو موثقة كلاحقة.
5. إذا كانت Feature جديدة، أنشئ/راجع spec.md قبل الكود.
6. إذا كان هناك قرار تقني جديد، أنشئ ADR.
7. نفذ باستخدام الـ stack المعتمد فقط.
8. اكتب أو حدّث الاختبارات.
9. حدّث docs إذا تغير السلوك.
10. قدم ملخصًا واضحًا بما تم وما لم يتم.
```

### مخرجات إلزامية من أي وكيل بعد كل مهمة

يجب أن يقدم الوكيل في نهاية المهمة:

```text
- Summary
- Files changed
- Specs updated
- ADRs added/updated
- Tests added/updated
- Risks/assumptions
- What is out of scope
- Compliance with AGENTS.md checklist
```

\---

## 21\. سياسة تغيير التقنية أو المسار

لا يجوز تغيير أي قرار أساسي بدون ADR.

### حالات تتطلب ADR

```text
تغيير Supabase إلى Backend آخر
إضافة NestJS
إضافة Microservices
استخدام BrightBean كقاعدة
استخدام Postiz كقاعدة
إضافة social scheduling
تغيير dnd-kit
تغيير نموذج tenancy
تغيير RLS model
تغيير طريقة احتساب SLA
تغيير workflow الاعتماد
```

### قالب ADR

```text
# ADR-XXX: عنوان القرار

## Status
Proposed / Accepted / Rejected / Superseded

## Context
ما المشكلة؟ لماذا نحتاج قرارًا؟

## Decision
ما القرار؟

## Alternatives considered
ما البدائل؟

## Consequences
الإيجابيات والسلبيات والمخاطر.

## Rollback plan
كيف نتراجع لو فشل القرار؟
```

\---

## 22\. مبادئ UX الإلزامية

### للعميل

* أقل عدد شاشات ممكن.
* لا مصطلحات داخلية.
* التركيز على: ماذا ينتظرني؟ ماذا تم؟ ماذا تبقى؟
* تاب “بانتظار موافقتي” يجب أن يكون واضحًا جدًا.
* الملفات النهائية سهلة الوصول.
* العقد والمتابعة يعرضان المتبقي والتقدم وSLA بشكل مفهوم.

### لفريق سماوة

* لوحة Kanban عملية.
* الكارت يحتوي كل شيء: وصف، ملفات، تعليقات، مهام، SLA، نسخ، اعتماد.
* التعليقات الداخلية سهلة وسريعة.
* رفع العمل يجب أن يكون بسيطًا.

### للإدارة

* رؤية عابرة للعملاء.
* مؤشرات SLA وتأخير.
* ما ينتظر الإدارة.
* ما ينتظر العميل.
* ضغط الفريق.
* جودة التسليم.

\---

## 23\. التصميم البصري المعتمد

استلهم من النماذج المعتمدة سابقًا:

```text
واجهة عربية RTL
تصميم SaaS حديث
كروت مستديرة
ألوان هادئة أبيض/بنفسجي/باستيل
Sidebar واضح
Dashboard بسيطة
Kanban بالكروت
Drawers للتفاصيل بدل صفحات كثيرة
```

لا تنسخ BrightBean أو أي منصة أخرى حرفيًا.  
استلهم من BrightBean وClickUp وTrello وMonday وLinear فقط على مستوى UX patterns.

\---

## 24\. مراجع وروابط يجب على الوكيل استخدامها أو مراعاتها

هذه الروابط مذكورة كمرجع للبحث والدراسة. يجب التحقق من الترخيص والإصدار قبل أي استخدام مباشر.

### Planning / Product / Architecture

```text
Product Manager Skills: https://github.com/deanpeters/Product-Manager-Skills
BMAD Method: https://github.com/bmad-code-org/bmad-method
GitHub Spec Kit: https://github.com/github/spec-kit
Agent OS: https://github.com/buildermethods/agent-os
arc42 Template: https://github.com/arc42/arc42-template
AWS SaaS Factory Reference: https://github.com/aws-samples/aws-saas-factory-ref-solution-serverless-saas
Azure Multitenant Guidance: https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/overview
OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
Shape Up: https://basecamp.com/shapeup
```

### Execution Stack

```text
Next.js: https://nextjs.org/docs
shadcn/ui: https://ui.shadcn.com
Supabase: https://supabase.com/docs
Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
dnd-kit: https://dndkit.com
TanStack Table: https://tanstack.com/table/latest/docs/introduction
TanStack Query: https://tanstack.com/query/latest
Zod: https://zod.dev
Uppy: https://uppy.io
Tiptap: https://tiptap.dev
FullCalendar: https://fullcalendar.io
Vitest: https://vitest.dev/guide
Playwright: https://playwright.dev
```

### Future Social Scheduling References

```text
BrightBean Studio: https://github.com/brightbeanxyz/brightbean-studio
Mixpost: https://github.com/inovector/mixpost
Postiz: https://github.com/gitroomhq/postiz-app
```

\---

## 25\. أولويات التنفيذ إذا حدث تضارب

إذا حدث تضارب بين السرعة والجودة، اتبع هذا الترتيب:

```text
1. أمن وعزل بيانات العملاء
2. صحة الصلاحيات
3. صحة التعميد وسجل التدقيق
4. صحة SLA
5. بساطة تجربة العميل
6. قابلية استخدام فريق سماوة
7. جمال الواجهة
8. ميزات إضافية
```

لا تضحي بعزل العملاء أو الصلاحيات أو Audit Log من أجل سرعة التنفيذ.

\---

## 26\. Definition of Done للمشروع في V1

لا يعتبر V1 جاهزًا إلا إذا تحقق التالي:

```text
- يمكن إضافة أكثر من عميل.
- يمكن إنشاء عقد/باقة للعميل.
- يمكن إضافة مخرجات مرنة.
- يمكن تعيين مسؤولين ومواعيد وSLA.
- يمكن إدارة المخرجات عبر Kanban داخلي.
- يمكن رفع ملفات مرتبطة بالمخرجات.
- يمكن كتابة تعليقات داخلية لا يراها العميل.
- يمكن إجراء تعميد داخلي.
- يمكن إرسال مخرج معتمد داخليًا للعميل.
- يمكن للعميل الاعتماد أو طلب تعديل.
- يتم تسجيل Audit Log لكل خطوة مهمة.
- تتوقف SLA عند انتظار العميل.
- لا يرى عميل بيانات عميل آخر.
- توجد اختبارات أساسية للصلاحيات وSLA والاعتماد.
- توجد لوحة بسيطة للعميل.
- توجد لوحة إدارة تعرض حالة العملاء والمخرجات وSLA.
```

\---

## 27\. تعليمات ختامية لأي وكيل

قبل أن تكتب أي كود أو خطة، أجب داخليًا على هذه الأسئلة:

```text
هل هذا يخدم المخرجات المتفق عليها؟
هل يحافظ على بساطة العميل؟
هل يحافظ على صلاحيات الفريق؟
هل يعزل بيانات العملاء؟
هل يكتب Audit Log؟
هل يحترم SLA؟
هل هناك Spec؟
هل نحتاج ADR؟
هل يوجد اختبار؟
```

إذا كانت الإجابة “لا” على سؤال جوهري، توقف وعدّل الخطة قبل المتابعة.
