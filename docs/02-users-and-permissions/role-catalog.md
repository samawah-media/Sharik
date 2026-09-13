# Role Catalog: شريك

**المرحلة:** Phase 03 - Roles, Permissions, Visibility & Delegation Model  
**نوع الوثيقة:** Role Catalog  
**الحالة:** Draft for owner review  
**آخر تحديث:** 2026-06-22  
**المنهجية المستخدمة:** Product Manager Skills + BMAD + مبادئ AWS/Azure Multitenancy + OWASP ASVS كمرجع تخطيطي  

## 1. الغرض

هذه الوثيقة تعرف أدوار الصلاحيات في شريك قبل أي تصميم تقني. الهدف هو منع الخلط بين المسمى الوظيفي، دور الصلاحية، ونطاق التعيين، ثم تثبيت من يملك أي نوع من السلطة داخل Platform أو Tenant أو Client أو Deliverable.

| التصنيف | النقطة |
| --- | --- |
| Confirmed | Tenant يمثل الوكالة أو الجهة المشغلة، وسماوة أول Tenant. |
| Confirmed | كل Tenant يدير عدة عملاء مع عزل كامل بين العملاء. |
| Confirmed | العميل لا يرى الداخلي ولا يرى عميل آخر. |
| Confirmed | مدير الحساب لا يعتمد نهائيا إلا بصلاحية صريحة. |
| Assumed | يمكن للمستخدم حمل أكثر من دور بشرط عدم كسر قواعد التعارض والتدقيق. |
| Open Question | هل تدخل أدوار Platform كاملة في V1 أم تظل محدودة لمالك المنتج والإدارة الفنية؟ |

## 2. مفاهيم أساسية

### 2.1 Job Title

المسمى الوظيفي هو وصف تنظيمي للشخص، مثل "مصمم" أو "مدير حساب". لا يمنح صلاحية وحده.

مثال: شخص مسماه "مدير حساب" قد يحمل دور `account_manager` على العميل A فقط، ولا يملك صلاحية اعتماد داخلي.

### 2.2 Permission Role

دور الصلاحية هو مجموعة إجراءات مسموحة أو مشروطة، مثل `client_approver` أو `project_manager`. هو الذي يستخدم في المصفوفة.

### 2.3 Assignment Scope

نطاق التعيين يحدد أين يسري الدور:

- Platform: على منصة شريك كمنتج متعدد Tenants.
- Tenant: على وكالة أو جهة مشغلة مثل سماوة.
- Client: على عميل داخل Tenant.
- Contract / Package: على عقد أو باقة محددة.
- Deliverable: على مخرج محدد.
- Task / File / Comment / Approval: على عنصر تشغيلي محدد.

| القاعدة | التصنيف |
| --- | --- |
| الصلاحية = Action + Resource + Scope + Conditions | Confirmed |
| Deny by Default هو الأصل | Confirmed |
| الدور لا يلغي شرط tenant/client isolation | Confirmed |
| أي توسعة Scope بعد بدء العمل تحتاج سبب وAudit Event | Confirmed |

## 3. أدوار Platform

| Role ID | الدور | الغرض | نطاقه الافتراضي | V1 | لا يستطيع افتراضيا | التصنيف |
| --- | --- | --- | --- | --- | --- | --- |
| `platform_owner` | Platform Owner | مالك المنتج أو الجهة المالكة لشريك كمنصة SaaS | Platform | يدخل V1 كنطاق حوكمة محدود | لا يفتح محتوى العملاء اليومي إلا عبر سياسة دعم أو تحقيق موثق | Assumed |
| `platform_administrator` | Platform Administrator | إدارة إعدادات المنصة وTenants والدعم التشغيلي الأعلى | Platform | يدخل V1 بحد أدنى لإدارة Tenant سماوة وأي Tenant تجريبي | لا يعتمد مخرجات العملاء ولا يتجاوز عزل البيانات دون سبب | Assumed |
| `platform_support` | Platform Support | دعم تقني أو تشغيلي محدود | Platform / Support Session | مؤجل غالبا في V1، أو Restricted فقط | لا يرى محتوى حساسا ولا ملفات داخلية دون تفويض support session وAudit كامل | Assumed |

### قاعدة Platform Support

Platform Support لا يستخدم كقناة "مشاهدة كل شيء". إذا احتاج الدعم الوصول لمحتوى Tenant أو Client، يجب وجود:

- سبب دعم محدد.
- موافقة Tenant Owner أو مالك مخول.
- مدة زمنية محدودة.
- Audit Event يوضح نطاق الوصول.
- إخفاء المحتوى الحساس قدر الإمكان.

## 4. أدوار Tenant والوكالة

| Role ID | الدور | الغرض | نطاقه الافتراضي | لا يستطيع افتراضيا | التصنيف |
| --- | --- | --- | --- | --- | --- |
| `tenant_owner` | Tenant Owner | مالك الوكالة أو الجهة المشغلة داخل شريك | Tenant | لا يتجاوز إلى Tenant آخر | Confirmed |
| `tenant_administrator` | Tenant Administrator | إدارة مستخدمي Tenant والعملاء والصلاحيات التشغيلية | Tenant أو Clients محددة | لا يعتمد باسم العميل ولا يكسر الداخلي/الخارجي | Assumed |
| `executive_management` | الإدارة العليا | رؤية إدارية وحسم الاستثناءات والتجاوزات الحساسة | Tenant أو Clients مصرح بها | لا تلغي Audit Log ولا تعتمد باسم العميل | Confirmed |
| `marketing_manager` | مدير التسويق | مراجعة جودة، تعميد داخلي، متابعة أداء وسير العمل | Client أو Deliverable أو Team | لا يعتمد باسم العميل | Confirmed |
| `project_manager` | مدير المشروع | تشغيل المخرجات، توزيع، مراجعة، تعميد، إرسال، تسليم | Client أو Contract أو Deliverable | لا يعتمد باسم العميل | Confirmed |
| `account_manager` | مدير الحساب | تنسيق العميل، متابعة، توزيع محدود، إرسال بعد التعميد إذا مخول | Client أو Contract | لا يعتمد داخليا أو نهائيا إلا بتفويض صريح | Confirmed |
| `quality_reviewer` | مراجع الجودة | مراجعة نسخة أو Checklist وطلب تعديل أو تعميد حسب التفويض | Deliverable أو Type | لا يعدل عقدا أو باقة | Assumed |

## 5. أدوار فريق التنفيذ

كل دور تنفيذ يرى ويعمل فقط ضمن العميل أو المخرج أو المهمة المسندة له، ما لم يمنح Scope أوسع.

| Role ID | الدور | الغرض | نطاقه الافتراضي | لا يستطيع افتراضيا | التصنيف |
| --- | --- | --- | --- | --- | --- |
| `marketing_specialist` | أخصائي التسويق | تنفيذ أو تنسيق مخرجات تسويقية وتحليل سياق الحملة | Deliverable / Client assigned | التعميد أو الإرسال للعميل | Assumed |
| `content_writer` | كاتب المحتوى | كتابة المحتوى ورفع النسخ النصية | Deliverable assigned | اعتماد داخلي أو تعديل عقد | Confirmed |
| `designer` | المصمم | تنفيذ التصاميم ورفع الملفات | Deliverable assigned | تحويل ملف للعميل دون إذن | Confirmed |
| `motion_designer` | مصمم الموشن | تنفيذ فيديو أو موشن ورفع نسخه | Deliverable assigned | اعتماد أو تسليم نهائي | Assumed |
| `performance_analyst` | محلل الأداء | إعداد تقارير وقراءة بيانات أداء مخولة | Client / Deliverable assigned | رؤية بيانات مالية حساسة إلا بتصريح | Confirmed |
| `publisher` | مسؤول النشر | توثيق أو تنفيذ نشر يدوي خارج المنصة عند الحاجة | Deliverable assigned | النشر الاجتماعي المباشر من شريك في V1 | Assumed |
| `contributor` | Contributor عام | مساهمة مؤقتة أو محدودة في مخرج | Deliverable assigned | أي إجراء حساس خارج التفويض | Assumed |

## 6. أدوار مستخدمي العميل

| Role ID | الدور | الغرض | نطاقه الافتراضي | لا يستطيع افتراضيا | التصنيف |
| --- | --- | --- | --- | --- | --- |
| `client_admin` | Client Administrator | إدارة مستخدمي جهة العميل أو طلب دعوتهم حسب سياسة V1 | Client | رؤية الداخلي أو عملاء آخرين | Confirmed in current implementation |
| `client_approver` | Client Approver | اعتماد مخرجات مرسلة أو طلب تعديل رسمي | Client أو Deliverable assigned | رؤية الداخلي أو تعديل SLA أو العقد | Confirmed |
| `client_reviewer` | Client Reviewer / Commenter مستقبلي | مراجعة وتعليق غير نهائي إذا نُفذ لاحقا | Client أو Deliverable assigned | اعتماد رسمي | Assumed; not implemented in Spec 015 |
| `client_viewer` | Client Viewer | مشاهدة الحالة والملفات المسموحة | Client | تعليق، رفع، طلب تعديل، أو اعتماد | Confirmed |

## 7. المستخدم متعدد الأدوار

| السؤال | القاعدة المقترحة | التصنيف |
| --- | --- | --- |
| هل يمكن حمل أكثر من دور؟ | نعم، بشرط تحديد الدور الفعال والسياق عند تنفيذ الإجراء. | Assumed |
| هل يمكن العمل على أكثر من عميل داخل نفس Tenant؟ | نعم، عبر assignment منفصل لكل Client أو Portfolio scope معتمد. | Confirmed |
| هل يمكن امتلاك دور مختلف لكل عميل؟ | نعم، مثلا Account Manager على العميل A وQuality Reviewer على العميل B. | Assumed |
| هل يمكن امتلاك صلاحية خاصة على مخرج محدد؟ | نعم، عبر Deliverable-scoped exception بتاريخ انتهاء وسبب. | Assumed |
| هل يسمح بتفويض مؤقت أثناء الإجازات؟ | نعم، بشرط ألا يتجاوز المفوض صلاحيات المفوض الأصلي وأن يكون مؤقتا ومؤرخا. | Assumed |

## 8. قواعد التعارض بين الأدوار

| التعارض | القاعدة | التصنيف |
| --- | --- | --- |
| عميل + عضو فريق على نفس Client | ممنوع افتراضيا؛ يحتاج فصل حسابات أو موافقة مالك موثقة. | Assumed |
| Creator / Owner يعتمد عمله داخليا | ممنوع افتراضيا في V1 للمخرجات الموجهة للعميل؛ يحتاج مراجع آخر أو Emergency Override. | Assumed |
| Account Manager يعتمد نهائيا | Deny إلا إذا وجد تفويض صريح محدد العميل/النوع/المدة. | Confirmed |
| Client Viewer يطلب تعديل رسمي | Deny؛ يمكنه فقط المشاهدة والتنزيل المسموح. أي تعليق مستقبلي يتطلب دور Reviewer مستقلا غير منفذ حاليا. | Confirmed |
| Platform Support يفتح ملفات حساسة | Deny إلا عبر support session موثق. | Assumed |
| تعديل SLA وتقييم أداء الفريق بنفس الشخص | Conditional؛ يحتاج سبب واضح لأن القرار يؤثر على التقارير. | Assumed |

## 9. BMAD Review

| زاوية BMAD | المراجعة | النتيجة |
| --- | --- | --- |
| Analyst | هل فصلنا الأطراف والنطاقات؟ | نعم: Platform, Tenant, Client, Deliverable. |
| PM | هل النموذج يخدم قلب V1؟ | نعم: المخرج، SLA، الاعتماد، الملفات، الصلاحيات. |
| UX | هل يحمي العميل من التعقيد؟ | نعم: العميل لا يرى الداخلي أو Kanban أو صلاحيات الإدارة. |
| QA | هل يمكن اختبار الأدوار؟ | نعم: كل دور له حدود Deny/Conditional قابلة للتحويل لاحقا لاختبارات. |
| Security | هل منعنا التصعيد غير المصرح؟ | نعم مبدئيا عبر least privilege وscope وaudit. |

## 10. Business Rules

| ID | القاعدة | التصنيف |
| --- | --- | --- |
| BR-RC-01 | المسمى الوظيفي لا يمنح صلاحية وحده. | Confirmed |
| BR-RC-02 | كل دور يجب أن يرتبط بنطاق واضح. | Confirmed |
| BR-RC-03 | العميل لا يمكن أن يحصل على دور يكشف الداخلي. | Confirmed |
| BR-RC-04 | الأدوار التنفيذية تعمل ضمن assigned scope افتراضيا. | Confirmed |
| BR-RC-05 | مدير الحساب لا يعتمد نهائيا إلا بصلاحية صريحة. | Confirmed |
| BR-RC-06 | Platform Support مؤجل أو مقيد بشدة في V1. | Assumed |
| BR-RC-07 | التفويض المؤقت يحتاج بداية ونهاية وسبب وAudit Event. | Confirmed |
| BR-RC-08 | أي Permission exception يجب أن تكون أضيق أو مساوية للنطاق المطلوب، لا مفتوحة. | Confirmed |
