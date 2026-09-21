# SIL-52 database worker report

## Status

Prepared candidate migration and standalone regression. Automated pgTAP RED/GREEN: **NOT RUN**. No database, network, credential access, test execution, build, commit, push, or deployment performed. Actual pre-fix Madar reproduction is lead-owned evidence, not an automated result.

Lead approved and the candidate now implements the narrow audit-authenticity extension. The existing `f001 audit insert own tenant` policy retains `f001_active_tenant_member(tenant_id)` and adds `action <> 'DeliverableVersionSentToClient'`. This blocks direct authoritative-event INSERT by authenticated clients and management alike, regardless of spoofed actor/time/target. It does not revoke unrelated audit INSERT, alter audit history, or change trusted SECURITY DEFINER workflow emission. Source inspection across all migrations found this is the only permissive audit INSERT policy; the other audit policy is SELECT-only, with no audit FOR ALL policy. Existing table INSERT grant stays unchanged. Actual database policy inventory remains a CI/compatibility gate.

Regression now covers spoof denial, unrelated own-tenant audit success/cross-tenant denial, and the real `s015_execute_internal_workflow(..., 'send_to_client', ...)` RPC returning waiting_client_approval/client_visible, emitting the exact scoped send event and successful command receipt. Its sent version is then checked through client reads after a new internal draft. These checks are prepared, not executed. Ready for independent source review and disposable CI; not cleared for hosted publication.

## Owned files

- `supabase/tests/database/s015_sil52_retained_client_version.test.sql`
- `supabase/migrations/202609100001_s015_sil52_retained_client_version.sql`
- This report.

Historical migrations, source/UI, shared spec/ADR and unrelated dirty documents were not modified.

## TS integration interface

`public.s015_client_readable_version_is_visible(target_tenant_id uuid, target_client_id uuid, target_deliverable_id uuid, target_version_id uuid) returns boolean`.

Authenticated-only EXECUTE, STABLE SECURITY DEFINER, fixed search_path. The new read helper requires active client membership and a client role before either branch. Existing `s015_client_current_version_is_visible` definition stays unchanged; its legacy current-visible behavior is preserved for authorized clients.

**Final app interface:** `public.s015_client_readable_versions(target_tenant_id uuid, target_client_id uuid, target_deliverable_ids uuid[]) returns table(deliverable_id uuid, version_id uuid)`. Authenticated-only EXECUTE, STABLE SECURITY DEFINER, fixed public search_path. Exact tenant/client/ID-array filters plus the new predicate select at most one designated snapshot per work. Unauthorized/missing scopes return no rows. No working/draft UUID is returned. App worker must use this RPC, then fetch content for its selected IDs; do not infer uniqueness from permissive version SELECT, because mixed staff/client roles legitimately see additional versions via staff RLS.

Fallback requires current version status draft/internal_only/internally_approved, greater version_number than the published version, and deliverable state client_changes_requested/in_progress/ready_for_internal_review/internal_changes_requested/internally_approved. Publication order is occurred_at DESC, sent version_number DESC, event id DESC. Exact event tenant/client/target_type/action/allowed decision and scoped version join; compare target_id to version UUID converted to text, never cast arbitrary audit text to UUID. The latest valid send is ranked before checking its readable status; missing or withdrawn publication denies instead of resurrecting older content.

## Read/write boundary inspection

Changed read consumers: client deliverable SELECT, version SELECT, comment SELECT, file SELECT, Storage read helper, member-profile read helper. Deliverable policy no longer requires the working pointer as its readable candidate. Author-profile read no longer requires comment.version_id = current_version_id. Existing staff branches, standalone document branch, internal visibility exclusions, Storage upload_state=ready and final_delivery delivered-state gate are preserved. Download RPC inherits the Storage read boundary.

Untouched write consumers: client decision, workspace comment, Storage upload/cleanup, registration and durable upload authorization. No current-version mutation helper replacement. The sole write-policy adjustment is the approved direct authoritative-send audit exclusion above.

## Regression design and limitations

BEGIN/ROLLBACK synthetic namespace 52000000. Core regression uses existing public SELECT/Storage/download RPC and stale mutation RPCs: legacy current visible/final without send history; missing-history denial; sent v2 throughout five rework states for approver/viewer; v1/v3/internal-comment/file/profile exclusion; pending/final Storage restrictions; cross-client/tenant and membership/role revocation; disallowed states; authoritative audit ordering and ties; newer-current requirement; withdrawn latest snapshot; explicit resend and stale approval/comment/upload denial with no successful mutation residue; direct audit spoof denial and actual send-RPC positive control.

Additional mixed staff/client regression proves ordinary RLS returns multiple public versions while the explicit selection RPC returns only designated snapshot IDs (also covering duplicate inputs, wrong scopes, missing IDs, revoked membership with staff role, and management-only denial). RPC checks use lives_ok around executable identity assertions, allowing missing-function errors to register as failures in the pre-migration RED run instead of aborting the file. These are behavior checks, not helper-presence assertions.

The malformed unrelated audit fixture uses an unrelated action: existing notification trigger itself casts allowed send target_id to UUID, so a malformed allowed-send fixture would abort setup before reaching these read policies. No triggers are disabled.

TDD/test-guard kept assertions on observable boundaries, not helper presence. Clean-code-guard static review surfaced the now-addressed audit-authenticity design gap. No runtime pass, SQL syntax execution, migration replay or hosted compatibility is claimed. Lead owns disposable CI RED (new migration excluded), GREEN (full migrations), independent security review and subsequent explicitly approved publication. Lead owns corresponding ADR/spec amendments; no shared documentation was edited here.
