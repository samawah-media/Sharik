# Files, Storage and Media Security: شريك

## 1. Strategy

V1 يستخدم Supabase Storage مع metadata في PostgreSQL. لا يكون storage path وحده مصدر قرار الوصول.

## 2. Metadata Required

- tenant_id.
- client_id.
- owner_user_id.
- related_deliverable_id.
- visibility.
- file_type.
- file_size.
- storage_path.
- version_number.
- is_final.
- checksum عند الإمكان.

## 3. Visibility Rules

| Visibility | العميل |
| --- | --- |
| internal_only | ممنوع |
| client_visible | مسموح بعد التعميد/الإرسال |
| client_uploaded | القراءة مسموحة داخل client scope؛ الإنشاء لـ`client_admin` أو `client_approver` فقط، وليس `client_viewer` |
| final_delivery | مسموح بعد التسليم |
| contract_file | حسب نسخة العميل |
| report_file | يظهر في الملفات، لا Tab مستقل |
| brand_asset | حسب سياسة العميل |

## 4. Download Flow

1. المستخدم يطلب الملف.
2. الخادم يتحقق من session وscope وmetadata visibility.
3. يسجل Audit عند التنزيل الحساس.
4. يولد signed URL قصير العمر.
5. لا تعرض روابط طويلة أو public buckets للملفات الحساسة.

## 5. Upload Flow

Uppy يرفع عبر مسار محكوم. بعد الرفع يجب تثبيت metadata وربط الملف بسياقه. Upload غير مثبت ينظف عبر job. حساب `client_viewer` للقراءة فقط ولا يحصل على مسار رفع؛ التحقق يطبق في واجهة المنتج، ودالة تفويض Storage، وPostgreSQL metadata trigger.

## 6. مخاطر الفيديو

Video-heavy scenario قد يرفع egress والتخزين. لا يعتمد R2 في V1 دون ADR لاحق، لكن يوثق كخيار خروج إذا زادت التكلفة.
