# Client Portal Permissions: شريك

**المرحلة:** Phase 03 - Roles, Permissions, Visibility & Delegation Model  
**نوع الوثيقة:** Client Portal Permissions  
**الحالة:** Draft for owner review  
**آخر تحديث:** 2026-07-20

## 1. الغرض

بوابة العميل يجب أن تكون أبسط واجهة في شريك. العميل يرى ما يخصه فقط، وما ينتظر قراره، وما تم تسليمه، ولا يرى أبدا التعليقات أو الملفات أو المراجعات الداخلية.

| التصنيف | النقطة |
| --- | --- |
| Confirmed | مستخدم العميل لا يرى بيانات عميل آخر. |
| Confirmed | مستخدم العميل لا يرى التعليقات الداخلية أو النسخ غير المرسلة. |
| Confirmed | `client_viewer` لا يعتمد ولا يطلب تعديلا رسميا. |
| Confirmed | `client_viewer` للقراءة فقط في V1: لا قرار، ولا تعليق، ولا رفع ملف. يمكن إضافة دور Reviewer مستقل لاحقا بقرار وصلاحية صريحة. |

## 2. أدوار بوابة العميل

| الدور | ماذا يرى؟ | ماذا يفعل؟ | ما الممنوع؟ | التصنيف |
| --- | --- | --- | --- | --- |
| Client Administrator | مستخدمي جهة العميل، مخرجات العميل، ملفات العميل المسموحة | طلب/إدارة دعوات العميل حسب سياسة V1، رؤية حالة العقد، قد يحمل دور Approver أيضا | رؤية الداخلي أو عملاء آخرين أو صلاحيات Tenant | Assumed |
| Client Approver | المخرجات المرسلة للاعتماد، الملفات المسموحة، تعليقات العميل | اعتماد، طلب تعديل، تعليق على القرار | رؤية نسخ داخلية أو اعتماد مخرج غير مرسل له | Confirmed |
| Client Reviewer / Commenter (مستقبلي، غير منفذ في Spec 015) | المخرجات المرسلة أو النهائية، تعليقات العميل | تعليق أو مراجعة غير ملزمة إذا اعتمد الدور لاحقا | اعتماد رسمي أو تغيير حالة | Assumed |
| Client Viewer | الحالة والملفات النهائية أو المسموحة | مشاهدة وتنزيل حسب الصلاحية | اعتماد، طلب تعديل رسمي، تعليق، أو رفع ملف | Confirmed |

## 3. شاشات العميل وصلاحياتها

| المساحة | Client Admin | Client Approver | Client Reviewer | Client Viewer | شروط الرؤية |
| --- | --- | --- | --- | --- | --- |
| الرئيسية | Allow | Allow | Allow | Allow | Client scope فقط |
| بانتظار موافقتي | Conditional | Allow | Conditional | Conditional view only | يظهر فقط إذا توجد مخرجات مرسلة للعميل |
| العقد والمتابعة | Allow | Allow | Allow | Allow | نسخة مبسطة دون داخلي أو مالي حساس غير مصرح |
| الملفات | Allow | Allow | Allow | Allow | client_visible, client_uploaded, final_delivery, contract_file |
| الإعدادات | Conditional | Deny | Deny | Deny | حسب اعتماد Client Admin في V1 |
| سجل قرارات العميل | Allow | Allow | Conditional | Conditional | لا يشمل Audit Log الداخلي |

## 4. إجراءات العميل

| الإجراء | Admin | Approver | Reviewer | Viewer | Audit Event | التصنيف |
| --- | --- | --- | --- | --- | --- | --- |
| مشاهدة مخرج مرسل | Allow | Allow | Allow | Allow | لا، إلا إذا تقرر تتبع view | Confirmed |
| تنزيل ملف مرئي للعميل | Allow | Allow | Allow | Allow | `file_downloaded` مقترح | Confirmed |
| اعتماد مخرج | Conditional إذا يحمل Approver | Allow | Deny | Deny | `client_approval_granted` | Confirmed |
| طلب تعديل رسمي | Conditional إذا يحمل Approver | Allow | Deny | Deny | `client_change_requested` | Confirmed |
| رفض/اعتراض | Conditional إذا يحمل Approver | Conditional | Deny | Deny | `client_rejection_recorded` | Assumed |
| إضافة تعليق عميل | Conditional | Allow | Allow إذا أضيف دور مستقل لاحقا | Deny | `client_comment_added` | Confirmed for implemented roles |
| رفع ملف عميل | Conditional | Conditional | Conditional إذا أضيف دور مستقل لاحقا | Deny | `client_file_uploaded` | Confirmed for implemented roles |
| إدارة مستخدمي العميل | Conditional | Deny | Deny | Deny | `client_member_invited/updated` | Open Question |

## 5. ما لا يظهر للعميل

| نوع البيانات | القاعدة | التصنيف |
| --- | --- | --- |
| Tenant آخر | لا يظهر أبدا | Confirmed |
| عميل آخر داخل نفس Tenant | لا يظهر أبدا | Confirmed |
| Kanban الداخلي | لا يظهر | Confirmed |
| التعليقات الداخلية | لا تظهر بأي شكل | Confirmed |
| Checklist الجودة | لا يظهر | Confirmed |
| النسخ غير المعتمدة داخليا | لا تظهر | Confirmed |
| الملفات `internal_only` | لا تظهر ولا تنزل | Confirmed |
| Audit Log الداخلي | لا يظهر؛ يمكن عرض سجل قرارات خارجي مبسط | Confirmed |
| delay owner | Open Question؛ التوصية إظهاره للعميل بنسخة مبسطة فقط بعد اعتماد المالك | Open Question |
| أسماء أعضاء الفريق | Assumed؛ تظهر فقط إذا اختيرت شفافية الفريق لاحقا | Open Question |

## 6. قواعد الموافقة في البوابة

1. لا يظهر زر اعتماد إلا لمستخدم يحمل `client_approver` داخل نفس Client أو Deliverable.
2. لا يمكن اعتماد نسخة لم ترسل للعميل.
3. لا يمكن اعتماد مخرج قبل `internally_approved`.
4. طلب التعديل يحتاج تعليق أو سبب.
5. كل قرار عميل مرتبط بالمستخدم والنسخة والتاريخ.
6. إذا كان هناك أكثر من Client Approver، فالنموذج النهائي يبقى Open Question حتى اعتماد المالك.

## 7. Business Rules

| ID | القاعدة | التصنيف |
| --- | --- | --- |
| BR-CP-01 | بوابة العميل scoped على Client واحد أو مجموعة Clients مصرح بها صراحة، وليس Tenant كاملا. | Confirmed |
| BR-CP-02 | Client Viewer لا يستطيع الاعتماد أو طلب تعديل رسمي. | Confirmed |
| BR-CP-03 | Client Approver لا يرى إلا النسخة المرسلة له. | Confirmed |
| BR-CP-04 | تعليق العميل لا يمنح رؤية للتعليقات الداخلية. | Confirmed |
| BR-CP-05 | سجل العميل الخارجي لا يساوي Audit Log الداخلي. | Confirmed |
| BR-CP-06 | إدارة مستخدمي العميل بواسطة Client Admin تحتاج اعتماد مالك قبل V1 النهائي. | Open Question |
| BR-CP-07 | الحساب الذي يحمل `client_viewer` فقط لا ينشئ `client_comment` أو `client_uploaded`؛ السماح الحالي محصور في `client_admin` أو `client_approver` داخل النطاق. | Confirmed |

## 8. قرار تنفيذ Spec 015

طبقة الواجهة تخفي نماذج القرار والتعليق والرفع عن `client_viewer`. طبقة PostgreSQL تمنع إدخال تعليق عميل أو metadata رفع عميل من حساب Viewer-only، كما أن فحص رفع Storage لا يمنحه صلاحية الرفع. هذا دفاع متعدد الطبقات؛ إخفاء الزر وحده ليس حد الصلاحية.
