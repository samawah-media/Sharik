# Tenancy and Data Isolation: شريك

## 1. النموذج

V1 يستخدم Shared Database + Shared Schema مع أعمدة scope واضحة. Tenant يمثل الوكالة، وClient داخل Tenant.

## 2. مستويات العزل

| المستوى | القاعدة |
| --- | --- |
| Tenant | لا يرى Tenant بيانات Tenant آخر |
| Client داخل Tenant | Client A لا يرى Client B |
| Assignment | الفريق يرى العملاء أو المخرجات المسندة له |
| Visibility | العميل لا يرى internal-only حتى داخل Client نفسه |
| Platform | أدوار المنصة حوكمة لا content access افتراضي |

## 3. Tenant Context

Tenant Context يحدد من:

- جلسة المستخدم.
- العضوية النشطة.
- النطاق المختار في الواجهة.
- المورد المستهدف.

لا يقبل `tenant_id` من العميل كحقيقة منفردة؛ يجب التحقق أنه ضمن عضوية المستخدم.

## 4. قواعد تصميم البيانات

- الجداول ذات بيانات عميل تحمل `tenant_id` و`client_id` أو FK يثبت النطاق.
- كل جدول حساس يحتاج RLS أو private schema مع server-side guard.
- `client_id` مطلوب للمخرجات، العقود، الملفات، التعليقات، الاعتمادات، SLA، ledger entries.
- Audit يحمل scope حتى للأحداث المرفوضة.

## 5. Client Isolation

Client ليس Tenant. لذلك العزل داخل Tenant يجب أن يكون صريحا:

- Client memberships.
- Assignment scopes.
- Approval scopes.
- File visibility.
- Comment visibility.

## 6. Noisy Neighbor

في Pilot لا نحتاج عزل موارد منفصل لكل Tenant. نراقب storage, egress, query latency, job duration. إذا ظهر Tenant كثيف الفيديو أو عالي الاستخدام، يفتح ADR لعزل storage أو tiering.

## 7. Spec 015 Hosted Team UAT Isolation

- Hosted Team UAT data must be synthetic Hadna-only and scoped by a unique run ID.
- Hosted preflight may inspect only counts and categories; it must not print row content, names, emails, deliverable titles, comments, file paths, tokens, or identifiers.
- Seeded UAT records must be tenant/client scoped, idempotent, safe to rerun, and removable by run ID without touching unrelated data.
- Team-controlled client viewer and client approver personas must remain limited to the synthetic Hadna client.
- Any unknown or possibly real customer data in the target stops execution before mutation.
