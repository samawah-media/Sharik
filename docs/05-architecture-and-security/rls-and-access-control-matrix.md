# RLS and Access Control Matrix: شريك

## 1. المبدأ

RLS طبقة دفاع أساسية، لكنها لا تعفي من Permission Evaluation في الخادم. أي سياسة يجب أن تجمع بين identity وscope وresource state.

## 2. مجموعات السياسات

| Group | الجداول | Predicate مفاهيمي |
| --- | --- | --- |
| Tenant scoped read | tenants, memberships | user has active tenant membership |
| Client scoped read | clients, contracts, deliverables | user has client scope or tenant management scope |
| Assignment scoped read | deliverables, tasks | user assigned or manager for client |
| Client portal read | deliverables, files, comments | client_id membership + visibility allowed |
| Internal-only deny | comments, files, versions | deny client roles when visibility internal |
| Audit scoped read | audit_events | management scope; client external history only |
| Ledger scoped read | usage_ledger | management/client limited summaries |

## 3. Write Access

Writes الحساسة لا تعتمد على RLS فقط. RLS تمنع الصفوف خارج النطاق، بينما Command Layer يطبق:

- permission id.
- state transition.
- required reason.
- version freshness.
- audit creation.

## 4. Views

أي View مكشوفة يجب أن تكون security-invoker أو في schema غير مكشوفة مع grants مقيدة. Read models للعميل لا تعرض internal fields.

## 5. Matrix مختصرة

| Resource | Client User | Team | PM/MM | Tenant Admin | Platform |
| --- | --- | --- | --- | --- | --- |
| Deliverable before internal approval | Deny | Assigned | Allow | Allow | Limited/no content |
| Deliverable sent to client | Own client | Assigned | Allow | Allow | Limited |
| Internal comment | Deny | Assigned | Allow | Allow | Deny by default |
| Client comment read | Own client when externally visible | Assigned | Allow | Allow | Limited |
| Client comment create | Approver/Admin only; Viewer deny | Assigned when permitted | Allow | Allow | Deny by default |
| Client-uploaded file create | Approver/Admin only; Viewer deny | Assigned when permitted | Allow | Allow | Deny by default |
| Internal file | Deny | Assigned | Allow | Allow | Deny by default |
| Final file | Own client | Assigned | Allow | Allow | Limited |
| Audit internal | Limited external only | Deny/limited | Allow | Allow | Restricted |
# Spec 015 exact-version command boundary

PostgreSQL rejects approval-derived and delivery targets through `f004_update_deliverable_status`. The persistent submission RPC checks tenant, client, supported internal role, and owner/contributor assignment. Delivered, cancelled, and archived records are terminal. Acceptance requires executed pgTAP evidence; test presence without a reachable local PostgreSQL instance is BLOCKED, not PASS.

## Spec 015 client viewer write boundary

`client_viewer` remains eligible only for scoped reads. Viewer-only actors are denied when inserting `client_comment` or `client_uploaded` metadata, and the Storage upload authorization helper excludes them. `client_admin` and `client_approver` retain the scoped paths required by the current V1 workflow. UI hiding is supplementary; PostgreSQL and Storage authorization are the enforcement boundary.
