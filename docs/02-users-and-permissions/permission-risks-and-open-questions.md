# Permission Risks and Open Questions: شريك

**المرحلة:** Phase 03 - Roles, Permissions, Visibility & Delegation Model  
**نوع الوثيقة:** Permission Risks and Open Questions  
**الحالة:** Draft for owner review  
**آخر تحديث:** 2026-07-20

## 1. الغرض

هذه الوثيقة تجمع مخاطر الصلاحيات وتسرب البيانات والأسئلة التي تحتاج اعتماد المالك قبل الانتقال إلى Core Data Model أو Specs.

## 2. أخطر 10 مخاطر صلاحيات أو تسرب بيانات

| # | الخطر | الأثر | التخفيف المقترح | التصنيف |
| --- | --- | --- | --- | --- |
| 1 | مستخدم عميل يرى بيانات عميل آخر داخل نفس Tenant | خرق ثقة وأمان حاسم | Client scope إلزامي، اختبارات cross-client | Confirmed |
| 2 | تعليق داخلي يظهر للعميل | ضرر علاقة وسمعة | Internal Only غير قابل للتحويل، اختبارات visibility | Confirmed |
| 3 | ملف داخلي يتحول للعميل دون تعميد | كشف مسودات أو معلومات حساسة | Permission مستقل لتحويل visibility وتأكيد إضافي | Confirmed |
| 4 | Account Manager يعتمد داخليا بلا تفويض | كسر بوابة الجودة | Deny by default وتفويض صريح | Confirmed |
| 5 | Client Viewer يعتمد عبر رابط مباشر | قرار غير مصرح | Permission check على الإجراء والنسخة والنطاق | Confirmed |
| 6 | تعديل SLA لإخفاء التأخير | تقارير غير عادلة | Audit لكل تعديل SLA وسبب إلزامي | Confirmed |
| 7 | تعديل رصيد الباقة دون موافقة | نزاع تجاري | صلاحية مستقلة وتأكيد إضافي | Confirmed |
| 8 | Platform Support يفتح محتوى حساس | خرق عبر مستوى المنصة | دعم مؤقت موثق أو تأجيل الدور | Assumed |
| 9 | مغادرة موظف مع مخرجات مفتوحة | ضياع مسؤولية وتعطيل SLA | نقل مسؤوليات قبل التعطيل | Confirmed |
| 10 | اعتماد متعدد من العميل دون قواعد واضحة | تضارب قرارات وتأخير | إبقاؤه Open Question حتى اعتماد المالك | Open Question |

## 3. قرارات تحتاج اعتماد المالك

| القرار | الخيارات | توصية V1 | التصنيف |
| --- | --- | --- | --- |
| هل يوجد Platform Super Admin كامل؟ | نعم / محدود / مؤجل | محدود بPlatform governance دون content access | Open Question |
| هل Platform Support يدخل V1؟ | نعم / Restricted / مؤجل | Restricted أو مؤجل | Assumed |
| هل يوجد اعتماد متعدد من العميل؟ | معتمد واحد / عدة متوازية / متسلسلة | معتمد واحد أو عدة بنفس الدور دون workflow متسلسل | Open Question |
| معنى رفض العميل | حالة مستقلة / طلب تعديل / إلغاء إداري | طلب تعديل/اعتراض موثق حتى الحسم | Open Question |
| المخرجات خارج الباقة | ممنوعة / استثناء / عادية | استثناء موثق فقط | Open Question |
| صلاحيات التجاوز | Executive فقط / PM أيضا / ممنوعة | Executive/Tenant Owner فقط | Assumed |
| ظهور delay owner للعميل | يظهر كامل / مبسط / لا يظهر | مبسط أو لا يظهر حتى قرار المالك | Open Question |
| من يعيد فتح المخرج؟ | PM / Executive / Tenant Owner | PM أو Executive بسبب موثق | Open Question |
| هل Client Admin يدير مستخدمي العميل؟ | نعم / طلب دعوة فقط / مؤجل | طلب دعوة أو إدارة محدودة | Open Question |
| هل Client Viewer يعلق؟ | حُسم في Spec 015 | لا؛ Viewer-only للقراءة فقط. أي تعليق مستقبلي يحتاج دور Reviewer مستقل وصلاحية صريحة. | Confirmed |
| Audit export في V1 | نعم / restricted / later | Restricted أو later | Open Question |
| رؤية الفريق لكل عملاء Tenant | كل العملاء / assigned clients / assigned deliverables | assigned clients/deliverables | Open Question |

## 4. أثر الأسئلة المفتوحة السابقة على الصلاحيات

| السؤال السابق | أثره على الصلاحيات | توصية المرحلة | التصنيف |
| --- | --- | --- | --- |
| تعدد معتمدي العميل | يحتاج `client_approver` متعدد وربما sequencing permissions | لا تعتمد sequencing في V1 دون قرار | Open Question |
| معنى رفض العميل | يحتاج Permission وAudit منفصلين إذا صار حالة | عامل الرفض كطلب تعديل/اعتراض موثق مؤقتا | Open Question |
| المخرجات خارج الباقة | يحتاج approval مستقل وscope إداري | اسمح فقط باستثناء موثق | Open Question |
| صلاحيات التجاوز | تحتاج Emergency Override وتأكيد إضافي | قيدها على Executive/Tenant Owner | Assumed |
| ظهور delay owner للعميل | يغير Client Portal visibility | أبقه للإدارة أو اعرض نسخة مبسطة لاحقا | Open Question |
| من يستطيع إعادة فتح المخرج | يؤثر على `PERM.DELIV.REOPEN` | PM/Executive فقط بسبب موثق | Open Question |

## 5. تعارضات مكتشفة بين الوثائق

| التعارض المحتمل | القراءة | الإجراء |
| --- | --- | --- |
| AGENTS.md القديم يذكر "كل عميل = tenant أو client scope"، بينما Phase 02 حسم أن Tenant هو الوكالة | لا تعارض بعد Phase 02؛ Client أصبح scope داخل Tenant | وثائق Phase 03 تعتمد قرار Phase 02 |
| أدوار AGENTS.md تبدأ بـ `samawah_admin` بينما شريك SaaS خارجي | نحتاج نموذج قابل للتعميم: Tenant Owner/Admin، وسماوة أول Tenant | تم تعميم الأدوار |
| Account Manager قد يرسل للعميل لكنه لا يعتمد | لا تعارض؛ الإرسال بعد التعميد Conditional | مثبت في matrix |
| رفض العميل مذكور في Audit لكن الحالة غير محسومة | تعارض غير حاسم؛ يعامل كاعتراض/طلب تعديل حتى قرار المالك | يبقى Open Question |
| Platform roles غير واضحة في Phase 01 | طبيعي لأن Phase 01 كانت high-level | Phase 03 أضافتها كAssumed/Open |

## 6. Readiness Assessment للانتقال إلى Core Data Model

| المجال | الجاهزية | الملاحظات |
| --- | --- | --- |
| Role catalog | Ready for owner review | كل عائلة أدوار مغطاة |
| Permission catalog | Ready for owner review | الصلاحيات granular وقابلة للتحويل لاختبارات |
| Visibility boundaries | Ready with open questions | delay owner وfinancial visibility يحتاجان اعتمادا |
| Approval authority | Partially ready | multi-approver ورفض العميل وسحب الاعتماد تحتاج قرارا |
| Delegation lifecycle | Ready for owner review | التفويض والمغادرة موثقان |
| Core Data Model readiness | Conditional | يمكن البدء بعد اعتماد قرارات V1 الحرجة أو وضعها كقيود واضحة |

### تقييم عام

المرحلة جاهزة مبدئيا للانتقال إلى Core Data Model بعد مراجعة المالك، بشرط عدم تحويل الأسئلة المفتوحة إلى قرارات تقنية ضمنية. أعلى القرارات المطلوبة قبل النمذجة: تعدد المعتمدين، رفض العميل، المخرجات خارج الباقة، إعادة الفتح، وظهور delay owner للعميل.

## 7. Compliance Checklist

| البند | الحالة |
| --- | --- |
| لم يتم تعديل أي كود | Confirmed |
| لم يتم إنشاء Specs أو `plan.md` أو `tasks.md` | Confirmed |
| لم يتم إنشاء ADRs | Confirmed |
| لم يتم تصميم قاعدة بيانات أو جداول | Confirmed |
| لم تتم كتابة SQL أو RLS policies | Confirmed |
| لم يتم اختيار Auth أو Backend | Confirmed |
| كل نقطة مصنفة Confirmed / Assumed / Open Question حيث يلزم | Confirmed |
| كل إجراء حساس مرتبط بAudit Event | Confirmed |
