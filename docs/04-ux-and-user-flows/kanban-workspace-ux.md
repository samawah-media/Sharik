# Kanban Workspace UX: شريك

**المرحلة:** Phase 05 - Information Architecture, UX Model & Role-Based User Flows  
**نوع الوثيقة:** Kanban Workspace UX  
**الحالة:** Draft for owner review  
**آخر تحديث:** 2026-06-23  

## 1. الغرض

Kanban أداة تشغيل داخلية للفريق والإدارة، وليست قلب تجربة العميل. الكارت تمثيل بصري لمخرج أو مهمة، ولا يتجاوز Business Rules.

## 2. الأعمدة المقترحة

| العمود | حالة المخرج |
| --- | --- |
| لم يبدأ | not_started |
| قيد التنفيذ | in_progress |
| جاهز للمراجعة الداخلية | ready_for_internal_review |
| يحتاج تعديل داخلي | internal_changes_requested |
| معتمد داخليا | internally_approved |
| بانتظار اعتماد العميل | waiting_client_approval |
| يحتاج تعديل من العميل | client_changes_requested |
| معتمد من العميل | client_approved |
| جاهز للتسليم | ready_for_delivery |
| تم التسليم | delivered |

يمكن للإدارة إخفاء بعض الأعمدة في عرض مختصر، لكن النموذج يجب أن يعرفها.

## 3. بطاقة Kanban

| العنصر | سبب العرض |
| --- | --- |
| اسم المخرج | التعرف السريع. |
| العميل | مهم للفريق والإدارة، لا لبوابة العميل. |
| النوع | منشور/Reel/تقرير/تصميم. |
| الأولوية | ترتيب العمل. |
| SLA | كشف الخطر والتوقف. |
| Owner | وضوح المسؤول. |
| عدد التعليقات/الملفات | مؤشر سياق. |
| شارة نسخة/تعميد | منع إرسال نسخة غير معتمدة. |

## 4. Drag & Drop Rules

| الحركة | القرار |
| --- | --- |
| إلى waiting_client_approval | مسموحة فقط إذا internally_approved وفاعل مخول. |
| إلى delivered | مسموحة فقط إذا client_approved أو لا يحتاج اعتماد عميل، مع Final Asset. |
| إلى internally_approved | لا تتم بالسحب للفريق؛ تحتاج قرار تعميد. |
| إلى ready_for_internal_review | تحتاج نسخة/محتوى. |
| من delivered إلى in_progress | ممنوعة؛ تحتاج Reopen command. |
| فشل الحفظ | Optimistic rollback. |

## 5. Accessible Alternative

لأن Drag and Drop قد لا يكون مناسبا للجميع:

- كل كارت يحتوي قائمة إجراءات "تغيير الحالة".
- كل انتقال حساس يظهر نفس قواعد التحقق.
- دعم لوحة المفاتيح مطلوب لاحقا في التنفيذ.
- الحالة لا تعتمد على اللون فقط.

## 6. Team Board

| المبدأ | UX |
| --- | --- |
| Scope | يعرض عملاء/مخرجات المستخدم المسندة. |
| Default | يبدأ بعميل أو مهامي حسب الدور. |
| Filters | عميل، نوع، حالة، SLA، owner، بحث. |
| Mobile | عرض قائمة أعمدة أو مراحل بدل سحب أفقي ثقيل. |

## 7. Management Board

| المبدأ | UX |
| --- | --- |
| Scope | كل العملاء المصرح بهم. |
| Views | حسب العميل، كل العملاء، مراجعة داخلية، بانتظار العميل. |
| Indicators | SLA، delay owner، blocked، package issue. |
| Actions | فتح Drawer، تعميد، إرسال، إعادة إسناد، تصعيد. |

## 8. Empty States

| الحالة | الرسالة |
| --- | --- |
| عمود فارغ | "ما فيه مخرجات في هذه المرحلة." |
| فلتر بلا نتائج | "ما لقينا مخرجات تطابق الفلاتر." |
| لا صلاحية للوحة | "هذه اللوحة غير متاحة لصلاحيتك الحالية." |

## 9. Demo Mapping

| عنصر من الديمو | القرار |
| --- | --- |
| Kanban Columns | Adapt: جيدة كبداية، تحتاج إضافة ready_for_delivery/client_approved. |
| Drag/drop المباشر | Rebuild: يجب إضافة قواعد منع وrollback. |
| Cards مع SLA/Owner | Preserve with changes. |
| عرض العميل للKanban | Remove: العميل لا يرى Kanban. |
| نص "Trello الكبرى" | Redesign: نبرة سعودية عملية بدون تسمية منتج خارجي. |
# Spec 015 protected workflow controls

The generic status selector offers only safe operational states (`not_started`, `in_progress`). Version submission, internal changes/approval, client send/decision, and final delivery use distinct exact-version controls. Team members see only their assigned board items when version submission is their sole workflow authority; management controls remain hidden and server-denied.
