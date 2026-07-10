# Permission Catalog: شريك

**المرحلة:** Phase 03 - Roles, Permissions, Visibility & Delegation Model  
**نوع الوثيقة:** Permission Catalog  
**الحالة:** Draft for owner review  
**آخر تحديث:** 2026-06-22  

## 1. الغرض

هذه الوثيقة تحول الأدوار إلى صلاحيات Granular يمكن لاحقا تحويلها إلى Specs واختبارات. لا تحتوي هذه الوثيقة على SQL أو RLS أو تصميم قاعدة بيانات.

كل Permission موثق عبر:

- Permission ID.
- الاسم والوصف.
- Resource / Action / Scope.
- الأدوار الافتراضية.
- الشروط.
- هل يحتاج Audit Event؟
- هل هو حساس؟
- هل يحتاج تأكيد إضافي؟

## 2. قواعد تسمية الصلاحيات

| العنصر | القاعدة |
| --- | --- |
| ID | `PERM.<DOMAIN>.<ACTION>` |
| حالة المنح | Allow / Deny / Conditional / Not Applicable |
| النطاق | Platform, Tenant, Client, Contract/Package, Deliverable, Task, File, Comment, Approval |
| Audit | مطلوب لكل إجراء يغير حالة أو صلاحية أو اعتماد أو SLA أو باقة أو visibility |
| Sensitive | أي إجراء قد يكشف بيانات، يغير صلاحيات، يؤثر على عميل/باقة/SLA/اعتماد |

## 3. المستخدمون والعضويات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.USR.VIEW` | عرض المستخدمين والعضويات ضمن النطاق | Users / View / Platform-Tenant-Client | Platform Admin, Tenant Admin, PM, AM, Client Admin | كل دور يرى مستخدمي نطاقه فقط | No | Yes | No |
| `PERM.USR.INVITE` | دعوة مستخدم جديد | Membership / Invite / Tenant-Client | Tenant Owner, Tenant Admin, PM, Client Admin | Client Admin يدعو داخل Client فقط أو يطلب دعوة حسب سياسة V1 | Yes | Yes | Yes |
| `PERM.USR.ROLE_UPDATE` | تعديل دور مستخدم | Membership / Update role / Tenant-Client | Tenant Owner, Tenant Admin | لا يسمح بتعديل دور أعلى من دور الفاعل؛ لا يعدل العميل أدوار Tenant | Yes | Yes | Yes |
| `PERM.USR.SUSPEND` | تعطيل عضوية مؤقتا | Membership / Suspend / Tenant-Client | Tenant Owner, Tenant Admin, PM | يجب نقل الأعمال المفتوحة أولا إذا كان Owner نشط | Yes | Yes | Yes |
| `PERM.USR.REMOVE` | إزالة مستخدم من نطاق | Membership / Remove / Tenant-Client | Tenant Owner, Tenant Admin | لا يمحو Audit history | Yes | Yes | Yes |
| `PERM.USR.INVITE_RESEND` | إعادة إرسال دعوة | Invitation / Resend / Tenant-Client | Tenant Admin, PM, Client Admin | الدعوة داخل النطاق ولم تنته سياسة الحظر | Yes | No | No |
| `PERM.USR.RESPONSIBILITY_TRANSFER` | نقل مسؤوليات قبل التعطيل أو المغادرة | Membership / Transfer / Client-Deliverable | Tenant Admin, PM, AM | يتطلب Owner جديد لكل مخرج نشط | Yes | Yes | Yes |

## 4. العملاء

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.CLIENT.VIEW` | عرض بيانات العميل الأساسية | Client / View / Client | TO, TA, EM, MM, PM, AM, QR, assigned execution, client roles | كل مستخدم ضمن assigned client فقط | No | Yes | No |
| `PERM.CLIENT.CREATE` | إنشاء عميل داخل Tenant | Client / Create / Tenant | TO, TA, PM | لا ينشئ Client خارج Tenant | Yes | Yes | Yes |
| `PERM.CLIENT.UPDATE` | تعديل بيانات العميل | Client / Update / Client | TO, TA, PM, AM conditional | AM يعدل حقولا تشغيلية فقط إن خول | Yes | Yes | Yes |
| `PERM.CLIENT.ASSIGN_TEAM` | تعيين فريق لعميل | Client team / Assign / Client | TO, TA, PM, AM conditional | لا يعين مستخدما خارج Tenant | Yes | Yes | Yes |
| `PERM.CLIENT.ARCHIVE` | أرشفة عميل | Client / Archive / Client | TO, TA, EM | يجب معالجة العقود والمخرجات المفتوحة | Yes | Yes | Yes |
| `PERM.CLIENT.VIEW_ALL_IN_TENANT` | مشاهدة عدة عملاء داخل Tenant | Client / View all / Tenant | TO, TA, EM, MM, PM | الفريق وAM يحتاجان assigned portfolio | No | Yes | No |

## 5. العقود والباقات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.CONTRACT.VIEW` | عرض العقد أو الباقة | Contract/Package / View / Client | TO, TA, EM, MM, PM, AM, Client Admin/Approver/Viewer limited | العميل يرى نسخة مبسطة لا تكشف الداخلي أو المالي الحساس إلا بسماح | No | Yes | No |
| `PERM.CONTRACT.MANAGE` | إنشاء أو تعديل عقد/باقة | Contract/Package / Create-Update / Client | TO, TA, PM | AM لا يعدل إلا بتفويض محدود | Yes | Yes | Yes |
| `PERM.PACKAGE.ITEM_MANAGE` | إضافة بنود الباقة أو أنواع المخرجات | Package / Manage items / Contract | TO, TA, PM | لا يغير رصيد مستهلك دون سبب | Yes | Yes | Yes |
| `PERM.PACKAGE.CREDIT_ADJUST` | تعديل الرصيد أو الكمية | Package / Adjust credit / Contract | TO, TA, EM | يتطلب سبب وموافقة إضافية | Yes | Yes | Yes |
| `PERM.PACKAGE.OUT_OF_SCOPE_CREATE` | إضافة مخرج خارج الباقة | Deliverable / Create out-of-package / Client | EM, PM conditional | استثناء موثق أو عمل مجاني/إضافي | Yes | Yes | Yes |
| `PERM.PACKAGE.OVERAGE_APPROVE` | اعتماد تجاوز الباقة | Package / Approve overage / Contract | TO, EM | لا يتم بصمت ويحتاج سبب | Yes | Yes | Yes |
| `PERM.CONTRACT.FINANCIAL_VIEW` | مشاهدة بيانات مالية حساسة | Contract / View financial / Client | TO, TA, EM | العميل يرى فقط ما يقرره المالك | No | Yes | No |

## 6. المخرجات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.DELIV.CREATE` | إنشاء مخرج متفق عليه | Deliverable / Create / Client-Contract | TO, TA, PM, AM conditional | ربط باقة عند وجودها أو سبب خارج الباقة | Yes | Yes | Yes |
| `PERM.DELIV.VIEW` | عرض مخرج | Deliverable / View / Deliverable | Management, AM, assigned execution, client roles after visibility | العميل لا يرى قبل الإرسال/التسليم المسموح | No | Yes | No |
| `PERM.DELIV.UPDATE` | تعديل بيانات المخرج | Deliverable / Update / Deliverable | TA, PM, AM conditional | لا يغير قواعد اعتماد أو SLA دون صلاحية مستقلة | Yes | Yes | No |
| `PERM.DELIV.ASSIGN` | إسناد owner أو contributors | Deliverable / Assign / Deliverable | TA, PM, AM conditional | لا يعين خارج Tenant أو Client scope | Yes | Yes | No |
| `PERM.DELIV.START` | بدء التنفيذ | Deliverable / Start / Deliverable | PM, AM, owner, assigned execution | وجود owner وموعد وSLA | Yes | Yes | No |
| `PERM.DELIV.STATUS_CHANGE` | تغيير حالة عام | Deliverable / Status change / Deliverable | PM, AM conditional, owner conditional | لا يتجاوز بوابات التعميد والعميل | Yes | Yes | No |
| `PERM.DELIV.SUBMIT_INTERNAL` | إرسال للمراجعة الداخلية | Deliverable / Submit / Deliverable | owner, assigned execution, AM, PM | وجود نسخة أو محتوى قابل للمراجعة | Yes | Yes | No |
| `PERM.DELIV.INTERNAL_CHANGE_REQUEST` | طلب تعديل داخلي | Deliverable / Request internal change / Deliverable | PM, MM, QR | تعليق داخلي مطلوب | Yes | Yes | Yes |
| `PERM.DELIV.INTERNAL_APPROVE` | التعميد الداخلي | Deliverable / Approve internally / Deliverable | PM, MM, QR conditional | لا يعتمد صاحب العمل عمله افتراضيا | Yes | Yes | Yes |
| `PERM.DELIV.SEND_CLIENT` | إرسال المخرج للعميل | Deliverable / Send to client / Deliverable | PM, MM, AM conditional | يجب أن يكون internally_approved | Yes | Yes | Yes |
| `PERM.DELIV.CLIENT_CHANGE_REQUEST` | تسجيل طلب تعديل من العميل | Deliverable / Client change request / Approval | Client Approver, PM external-entry conditional | العميل المخول أو إدخال خارجي موثق | Yes | Yes | Yes |
| `PERM.DELIV.CLIENT_APPROVE` | اعتماد العميل | Deliverable / Client approve / Approval | Client Approver | النسخة المرسلة فقط وضمن Client scope | Yes | Yes | Yes |
| `PERM.DELIV.DELIVER` | التسليم النهائي | Deliverable / Deliver / Deliverable | PM, MM, EM, AM conditional | اعتماد عميل إن كان مطلوبا، ونسخة نهائية | Yes | Yes | Yes |
| `PERM.DELIV.CANCEL` | إلغاء مخرج | Deliverable / Cancel / Deliverable | PM, EM, TO | سبب وأثر باقة موثق | Yes | Yes | Yes |
| `PERM.DELIV.REOPEN` | إعادة فتح مخرج | Deliverable / Reopen / Deliverable | PM, EM, TO | سبب موثق؛ سياسة SLA/credit ما زالت Open Question | Yes | Yes | Yes |
| `PERM.DELIV.REPLACE` | استبدال مخرج | Deliverable / Replace / Contract | PM, EM | يوضح أثر الحجز والاستهلاك | Yes | Yes | Yes |
| `PERM.DELIV.OWNER_CHANGE` | تغيير المسؤول | Deliverable / Change owner / Deliverable | PM, AM conditional | سبب مطلوب بعد بدء التنفيذ | Yes | Yes | No |
| `PERM.DELIV.DUE_DATE_UPDATE` | تعديل موعد مخرج | Deliverable / Update due date / Deliverable | PM, MM, AM conditional | لا يستخدم لإخفاء تأخير دون Audit | Yes | Yes | Yes |
| `PERM.DELIV.SLA_UPDATE` | تعديل إعداد SLA للمخرج | Deliverable/SLA / Update / Deliverable | PM, MM, EM | سبب وتأكيد إضافي | Yes | Yes | Yes |

## 7. Kanban والمهام

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.KANBAN.VIEW` | عرض لوحة Kanban الداخلية | Kanban / View / Client-Team | Management, AM, assigned execution | لا يظهر للعميل | No | Yes | No |
| `PERM.TASK.CREATE` | إنشاء بطاقة أو مهمة | Task / Create / Deliverable | PM, AM, owner conditional | ترتبط بمخرج أو عميل مصرح | Yes | No | No |
| `PERM.KANBAN.MOVE_CARD` | نقل كارت | Kanban / Move / Deliverable | PM, AM conditional, owner conditional | يحترم انتقالات الحالة وrollback عند فشل لاحق | Yes | Yes | No |
| `PERM.TASK.PRIORITY_UPDATE` | تغيير الأولوية | Task/Deliverable / Update priority / Deliverable | PM, AM, owner conditional | لا يغير SLA وحده | Yes | No | No |
| `PERM.TASK.ASSIGN_USER` | إسناد مستخدم لمهمة | Task / Assign / Task | PM, AM, owner conditional | داخل Tenant وClient scope | Yes | No | No |
| `PERM.TASK.DUE_UPDATE` | تعديل موعد مهمة | Task / Update due / Task | PM, AM, owner conditional | لا يغير موعد المخرج إلا بصلاحية منفصلة | Yes | No | No |
| `PERM.TASK.ARCHIVE_DELETE` | حذف أو أرشفة مهمة | Task / Archive-Delete / Task | PM, AM conditional | لا يحذف Audit أو الملفات | Yes | Yes | Yes |

## 8. التعليقات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.COMMENT.INTERNAL_ADD` | إضافة تعليق داخلي | Comment / Create internal / Deliverable | Management, AM, assigned execution | لا يظهر للعميل أبدا | Yes | Yes | No |
| `PERM.COMMENT.INTERNAL_VIEW` | مشاهدة التعليقات الداخلية | Comment / View internal / Deliverable | Management, AM, assigned execution | assigned scope فقط للفريق | No | Yes | No |
| `PERM.COMMENT.CLIENT_ADD` | إضافة تعليق مرئي للعميل | Comment / Create client-visible / Deliverable | Client Approver, Client Reviewer, PM, AM | Client Viewer يحتاج ترقية Reviewer | Yes | Yes | No |
| `PERM.COMMENT.CLIENT_VIEW` | مشاهدة تعليقات العميل | Comment / View client / Deliverable | Management, AM, assigned execution, client roles | كل طرف ضمن Client scope | No | Yes | No |
| `PERM.COMMENT.EDIT_DELETE` | تعديل أو حذف تعليق | Comment / Update-Delete / Comment | author conditional, PM conditional | لا يعدل قرار اعتماد بعد تسجيله إلا بسجل تصحيح | Yes | Yes | Yes |
| `PERM.COMMENT.MENTION` | الإشارة إلى مستخدم | Comment / Mention / Comment | users who can comment | لا يذكر مستخدما خارج النطاق | No | No | No |
| `PERM.COMMENT.RESOLVE` | حل تعليق أو إعادة فتحه | Comment / Resolve-Reopen / Comment | PM, AM, author conditional | لا يحل تعليق قرار دون صلاحية | Yes | No | No |

## 9. الملفات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.FILE.UPLOAD_INTERNAL` | رفع ملف داخلي | File / Upload internal / Deliverable | Management, AM, assigned execution | visibility = internal_only | Yes | Yes | No |
| `PERM.FILE.UPLOAD_VERSION` | رفع نسخة جديدة | File / Upload version / Deliverable | Management, AM, assigned execution | إذا بعد التعميد يحتاج مراجعة جديدة قبل الإرسال | Yes | Yes | No |
| `PERM.FILE.INTERNAL_VIEW` | مشاهدة الملفات الداخلية | File / View internal / Deliverable | Management, AM, assigned execution | لا يظهر للعميل | No | Yes | No |
| `PERM.FILE.MARK_CLIENT_VISIBLE` | تحويل ملف إلى Client Visible | File / Change visibility / File | PM, MM, AM conditional | لا يتم إلا بعد تحقق الرؤية والتعميد عند الحاجة | Yes | Yes | Yes |
| `PERM.FILE.MARK_FINAL` | تحديد نسخة نهائية | File / Mark final / File | PM, MM, EM, AM conditional | يجب أن ترتبط بالتسليم النهائي | Yes | Yes | Yes |
| `PERM.FILE.DOWNLOAD` | تنزيل ملف | File / Download / File | users with view permission | يمنع خارج Tenant/Client scope | Yes | Yes | No |
| `PERM.FILE.DELETE` | حذف ملف | File / Delete / File | PM, TA, EM | لا يحذف نسخة مرتبطة بقرار إلا بسياسة تصحيح | Yes | Yes | Yes |
| `PERM.FILE.VERSION_HISTORY_VIEW` | مشاهدة سجل النسخ | File / View versions / File | Management, AM, assigned execution | العميل يرى فقط النسخ المرسلة/النهائية المسموحة | No | Yes | No |

## 10. التعميدات والاعتمادات

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.APPROVAL.REQUEST_INTERNAL` | طلب مراجعة داخلية | Approval / Request internal / Deliverable | owner, assigned execution, AM, PM | وجود نسخة قابلة للمراجعة | Yes | Yes | No |
| `PERM.APPROVAL.INTERNAL_GRANT` | التعميد الداخلي | Approval / Grant internal / Deliverable | PM, MM, QR conditional | فصل maker/checker حيث أمكن | Yes | Yes | Yes |
| `PERM.APPROVAL.INTERNAL_REVOKE` | سحب التعميد | Approval / Revoke internal / Deliverable | PM, MM, EM | قبل الإرسال أو بسبب خطأ موثق | Yes | Yes | Yes |
| `PERM.APPROVAL.SEND_CLIENT` | إرسال المخرج للعميل | Approval / Send client / Deliverable | PM, MM, AM conditional | نسخة معتمدة داخليا | Yes | Yes | Yes |
| `PERM.APPROVAL.CLIENT_GRANT` | اعتماد العميل | Approval / Client approve / Approval | Client Approver | ضمن Client/Deliverable scope | Yes | Yes | Yes |
| `PERM.APPROVAL.CHANGE_REQUEST` | طلب تعديل | Approval / Request change / Approval | Client Approver, PM internal | نوع الطلب يحدد داخلي أو عميل | Yes | Yes | Yes |
| `PERM.APPROVAL.DELEGATE` | التفويض في الاعتماد | Approval / Delegate / Tenant-Client | TO, TA, EM, Client Admin conditional | مدة ونطاق وسبب؛ لا يتجاوز صلاحيات الأصل | Yes | Yes | Yes |
| `PERM.APPROVAL.EMERGENCY_OVERRIDE` | التجاوز الإداري الطارئ | Approval / Override / Deliverable | TO, EM | استثناء نادر، سبب، مراجعة لاحقة | Yes | Yes | Yes |

## 11. SLA

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.SLA.VIEW` | مشاهدة SLA | SLA / View / Deliverable | Management, AM, assigned execution, client limited | العميل يرى نسخة مبسطة حسب قرار المالك | No | Yes | No |
| `PERM.SLA.TIMER_CONTROL` | بدء أو إيقاف أو استئناف العداد | SLA / Start-Pause-Resume / Deliverable | PM, system event, AM conditional | يجب أن يتبع حالة المخرج ولا يستخدم يدويا دون سبب | Yes | Yes | Yes |
| `PERM.SLA.DUE_DATE_UPDATE` | تعديل موعد SLA | SLA / Update due / Deliverable | PM, MM, EM | سبب واضح وتأكيد | Yes | Yes | Yes |
| `PERM.SLA.PAUSE_REASON_UPDATE` | تغيير سبب التوقف | SLA / Update pause reason / Deliverable | PM, MM, EM | لا يغير delay owner لإخفاء التأخير | Yes | Yes | Yes |
| `PERM.SLA.DELAY_OWNER_RECORD` | تسجيل delay owner | SLA / Record delay owner / Deliverable | PM, MM, EM, AM conditional | يظهر للإدارة؛ ظهوره للعميل Open Question | Yes | Yes | Yes |
| `PERM.SLA.OVERRIDE` | تجاوز SLA أو تصحيح حالته | SLA / Override / Deliverable | EM, TO | مراجعة لاحقة مطلوبة | Yes | Yes | Yes |
| `PERM.SLA.ESCALATION_CLOSE` | إغلاق التصعيد | SLA / Close escalation / Deliverable | PM, MM, EM | سبب الإغلاق مطلوب | Yes | Yes | Yes |
| `PERM.SLA.ALL_CLIENTS_VIEW` | مشاهدة مؤشرات SLA لجميع العملاء | SLA / View dashboard / Tenant | TO, TA, EM, MM, PM | AM فقط لعملائه المسندين | No | Yes | No |

## 12. Audit Log والتقارير

| ID | الاسم والوصف | Resource / Action / Scope | الأدوار الافتراضية | الشروط | Audit | Sensitive | Confirm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PERM.AUDIT.DELIVERABLE_VIEW` | مشاهدة سجل المخرج | Audit Log / View / Deliverable | Management, AM, QR, client limited external history | العميل لا يرى السجل الداخلي | No | Yes | No |
| `PERM.AUDIT.USER_VIEW` | مشاهدة سجل المستخدم | Audit Log / View user / Tenant | TO, TA, EM | لأغراض إدارة وصلاحيات | No | Yes | No |
| `PERM.AUDIT.CLIENT_VIEW` | مشاهدة سجلات العميل | Audit Log / View client / Client | TO, TA, EM, PM | AM حسب العميل | No | Yes | No |
| `PERM.AUDIT.EXPORT` | تصدير السجلات | Audit Log / Export / Tenant-Client | TO, EM | يتطلب سبب ونطاق زمني | Yes | Yes | Yes |
| `PERM.REPORT.TEAM_VIEW` | مشاهدة تقارير الفريق | Reports / View team / Tenant-Client | TO, TA, EM, MM, PM | لا تظهر للعميل | No | Yes | No |
| `PERM.REPORT.ADMIN_VIEW` | مشاهدة التقارير الإدارية | Reports / View admin / Tenant | TO, TA, EM, MM, PM | AM يرى تقارير عملائه فقط | No | Yes | No |

## 13. Permissions مؤجلة أو مشروطة بقوة في V1

| Permission | التوصية | التصنيف |
| --- | --- | --- |
| Platform Support content access | يؤجل أو يقيد بدعم موثق ومؤقت | Assumed |
| Multi-client client user | Deny؛ مستخدم العميل لا يربط بأكثر من Client إلا بقرار مالك واضح | Confirmed |
| Multi-approver sequential approval | Open Question؛ لا يبنى كقاعدة مؤكدة قبل اعتماد المالك | Open Question |
| Emergency Override | يبقى صلاحية نادرة للإدارة العليا فقط | Assumed |
| Manual external client decision | مسار انتقالي مشروط وليس الهدف الأساسي | Open Question |
# Spec 015 corrective permission

`PERM.DELIVERABLE.VERSION_SUBMIT` is independent from generic status authority. It is granted to scoped `account_manager`, `content_writer`, and `designer` roles, but execution also requires the actor to be the deliverable owner or a contributor. It does not grant internal approval, client send, client decision, or final delivery.

