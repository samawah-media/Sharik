# Observability, Backup and Recovery: شريك

## 1. Observability

راقب:

- auth failures.
- access denied by reason.
- command failures.
- SLA job duration.
- storage upload/download failures.
- query latency للوحاته الأساسية.
- notification delivery.

## 2. Logging

لا تسجل محتوى ملفات أو تعليقات حساسة في application logs. استخدم request_id وtenant_id وclient_id والنتيجة.

## 3. Backup

- database backups عبر Supabase plan/strategy.
- storage backup/export strategy قبل Production.
- audit/ledger retention policy.

## 4. Recovery

اختبر restore قبل Production. هدف V1 المقترح:

| Metric | Pilot Target |
| --- | --- |
| RPO | أقل من 24 ساعة كحد أولي |
| RTO | نفس يوم العمل للـPilot |

القيم النهائية تعتمد على خطة الاستضافة والتكلفة.

## 5. Incident Response

حوادث العزل أو internal content leakage تعامل كأولوية قصوى، مع freeze مؤقت للعمليات المتأثرة، audit review، وإبلاغ المالك.

## 6. Spec 015 Hosted Team UAT Rollback

- Deployment rollback removes or disables only the Preview deployment/alias created by the UAT run, or reverts to the previous reviewed Preview deployment if one exists.
- Database rollback removes only run-ID-scoped synthetic rows created by the UAT run. Destructive down migrations must not run against shared UAT.
- Access rollback disables only UAT test accounts and revokes only role assignments created by the UAT run.
- Rollback evidence records owner, executor, execution window, stop authority, expected rollback time, verification steps, and category/count-only results.
