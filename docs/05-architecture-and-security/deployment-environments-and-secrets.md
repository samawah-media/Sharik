# Deployment, Environments and Secrets: شريك

## 1. Environments

| Environment | الغرض |
| --- | --- |
| local | تطوير فردي |
| preview | مراجعة تغييرات |
| staging | اختبار قريب من production |
| production | تشغيل العملاء |

## 2. Secrets

- أسرار منفصلة لكل بيئة.
- لا توضع secret/service keys في `NEXT_PUBLIC_*`.
- rotate عند مغادرة مسؤول أو شك في التسرب.
- CI لا يطبع الأسرار في logs.

## 3. Deployment

يفضل Vercel أو منصة متوافقة مع Next.js. Supabase project مستقل للـproduction. Preview environments يجب ألا تستخدم بيانات Production حقيقية.

## 4. Release Controls

- migrations لاحقا بعد Specs.
- feature flags للميزات الحساسة عند الحاجة.
- rollback plan لكل release.
- smoke tests للـauth والعزل والعمليات الحساسة.

## 5. Spec 015 Hosted Team UAT Controls

- Spec 015 hosted Team UAT may use only Vercel Preview/UAT and a verified Supabase UAT project.
- Production deployment, Production aliases/domains, Vercel Production environment variables, and Production Supabase access are out of scope.
- Preview/UAT environment variables must be configured separately and must point only to Supabase UAT.
- Service-role keys must never be exposed through `NEXT_PUBLIC_*`, browser bundles, logs, screenshots, Git, PR text, or evidence.
- Hosted URLs, project refs, credentials, emails, tokens, row identifiers, and file paths must not be committed.
- Public signup must remain disabled during Team-Only UAT.
- Any ambiguous hosted target stops execution before mutation.
