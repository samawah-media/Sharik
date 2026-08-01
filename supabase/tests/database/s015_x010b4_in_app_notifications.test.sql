-- X010-B4 in-app notifications pgTAP.
-- Proves the notification center behaves correctly at the database boundary:
-- recipient routing per event, client-safe vs internal copy, dedupe, RLS
-- (recipient-only, tenant + Client A/B isolation, disabled-membership denial),
-- scoped mark-read, the action_href allowlist CHECK, and the read-only guard.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- ============================================================================
-- Fixtures: one tenant, Client A + Client B, internal management, assigned
-- account manager, client approver/viewer for A, client approver for B.
-- ============================================================================
insert into public.tenants (id, name) values
  ('b4000000-0000-4000-8000-000000000001', 'B4 Tenant A');

insert into public.clients (id, tenant_id, name, slug) values
  ('b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000001', 'B4 Client A', 'b4-a'),
  ('b4000000-0000-4000-8000-000000000102', 'b4000000-0000-4000-8000-000000000001', 'B4 Client B', 'b4-b');

-- Internal users: 201 tenant_admin (management actor), 205 account_manager (owner)
-- 206 a second management member who should also be notified of client decisions.
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('b4000000-0000-4000-8000-000000000201', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000301', 'active'),
  ('b4000000-0000-4000-8000-000000000202', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000305', 'active'),
  ('b4000000-0000-4000-8000-000000000203', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000306', 'active'),
  ('b4000000-0000-4000-8000-000000000204', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000307', 'disabled');

-- Client memberships: 302 approver A, 303 viewer A, 304 approver B,
-- 308 Client A member without a client role (must never be a recipient).
insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
  ('b4000000-0000-4000-8000-000000000211', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000302', 'active'),
  ('b4000000-0000-4000-8000-000000000212', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000303', 'active'),
  ('b4000000-0000-4000-8000-000000000213', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000102', 'b4000000-0000-4000-8000-000000000304', 'active'),
  ('b4000000-0000-4000-8000-000000000214', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000308', 'active');

-- tenant_memberships for the client portal users so they can authenticate in the tenant
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('b4000000-0000-4000-8000-000000000205', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000302', 'active'),
  ('b4000000-0000-4000-8000-000000000206', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000303', 'active'),
  ('b4000000-0000-4000-8000-000000000207', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000304', 'active'),
  ('b4000000-0000-4000-8000-000000000208', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000308', 'active'),
  ('b4000000-0000-4000-8000-000000000209', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000310', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  -- 301 tenant_admin (management)
  ('b4000000-0000-4000-8000-000000000401', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000201', 'tenant_administrator', 'tenant', 'b4000000-0000-4000-8000-000000000001', 'active'),
  -- 305 account_manager on Client A (deliverable owner)
  ('b4000000-0000-4000-8000-000000000405', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000202', 'account_manager', 'client', 'b4000000-0000-4000-8000-000000000101', 'active'),
  -- 306 second management member (marketing_manager tenant scope)
  ('b4000000-0000-4000-8000-000000000406', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000203', 'marketing_manager', 'tenant', 'b4000000-0000-4000-8000-000000000001', 'active'),
  -- 302 client_approver A
  ('b4000000-0000-4000-8000-000000000411', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000205', 'client_approver', 'client', 'b4000000-0000-4000-8000-000000000101', 'active'),
  -- 303 client_viewer A
  ('b4000000-0000-4000-8000-000000000412', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000206', 'client_viewer', 'client', 'b4000000-0000-4000-8000-000000000101', 'active'),
  -- 304 client_approver B
  ('b4000000-0000-4000-8000-000000000413', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000207', 'client_approver', 'client', 'b4000000-0000-4000-8000-000000000102', 'active'),
  -- 310 assigned content writer for Client A
  ('b4000000-0000-4000-8000-000000000414', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000209', 'content_writer', 'client', 'b4000000-0000-4000-8000-000000000101', 'active');

-- One deliverable in Client A owned by the account_manager (305), with a current version.
-- Insert in a non-review status first so the client-review-payload guard does not fire
-- before the version and its caption exist, then advance to the review state in one
-- update that carries a meaningful client-review payload.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, owner_user_id, contributor_user_ids,
  requires_internal_approval, requires_client_approval
) values
  ('b4000000-0000-4000-8000-000000000501', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101', 'B4 post', 'post', 'in_progress', 50, 'b4-deliverable-a', 'b4000000-0000-4000-8000-000000000305', array['b4000000-0000-4000-8000-000000000310']::uuid[], true, true);

insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, caption
) values
  ('b4000000-0000-4000-8000-000000000601', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000501', 1, 'client_visible', 'مراجعة العميل لمنشور B4');
update public.deliverables
  set current_version_id = 'b4000000-0000-4000-8000-000000000601',
      status = 'waiting_client_approval',
      progress_percentage = 80
  where id = 'b4000000-0000-4000-8000-000000000501';

-- ============================================================================
-- 1. Send-to-client: client approver + viewer are notified with client-safe
--    copy and the /client/pending href. The actor (management) is NOT notified.
-- ============================================================================
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
) values (
  'b4000000-0000-4000-8000-000000000a01', 'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000301',
  'DeliverableVersionSentToClient', 'allowed', 'deliverable_version',
  'b4000000-0000-4000-8000-000000000601', 'send_to_client'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01'
      and recipient_user_id in ('b4000000-0000-4000-8000-000000000302','b4000000-0000-4000-8000-000000000303')),
  2,
  'send-to-client notifies both client approver and viewer'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000301'),
  0,
  'the management actor who sent the work is not notified'
);

select is(
  (select action_href from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01' limit 1),
  '/client/pending',
  'client send notification points to the client pending route'
);

select is(
  (select (message like '%B4 post%') from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01' limit 1),
  true,
  'client notification uses client-safe deliverable name, not internal data'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000308'),
  0,
  'an active client membership without an active client role is not notified'
);

select is(
  (select message like '%اعتمدها%' from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000302'),
  true,
  'client approver copy explains the available approval action'
);

select is(
  (select message like '%القرار لدى المسؤول عن الاعتماد%'
          and message not like '%اعتمدها%'
     from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a01'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000303'),
  true,
  'client viewer copy is read-only and never asks the viewer to approve'
);

-- ============================================================================
-- 2. Client approval: internal management is notified, clients are NOT.
-- ============================================================================
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
) values (
  'b4000000-0000-4000-8000-000000000a02', 'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000302',
  'ClientVersionDecision', 'allowed', 'deliverable_version',
  'b4000000-0000-4000-8000-000000000601', 'approved'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a02'
      and recipient_user_id in ('b4000000-0000-4000-8000-000000000301','b4000000-0000-4000-8000-000000000306')),
  2,
  'client approval notifies tenant management (tenant admin + marketing manager)'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a02'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000302'),
  0,
  'the client who approved is not notified of their own decision'
);

-- ============================================================================
-- 3. Internal change request: the deliverable owner is notified.
-- ============================================================================
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
) values (
  'b4000000-0000-4000-8000-000000000a03', 'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000301',
  'DeliverableInternalChangesRequested', 'allowed', 'deliverable_version',
  'b4000000-0000-4000-8000-000000000601', 'request_internal_changes'
);

select is(
  (select count(*)::integer from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a03'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000305'),
  1,
  'internal change request notifies the assigned owner'
);

-- ============================================================================
-- 4. Task assignment: the assignee is notified; actor-as-assignee is not.
--    Run as the table owner (no role switch) so the direct insert is not blocked
--    by task RLS, but set the JWT claim so auth.uid() resolves inside the
--    trigger and the actor-exclusion path is genuinely exercised.
-- ============================================================================
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000301', true);
insert into public.deliverable_tasks (
  id, tenant_id, client_id, deliverable_id, title, status, priority,
  assignee_user_id, sort_order, created_by
) values
  ('b4000000-0000-4000-8000-000000000701', 'b4000000-0000-4000-8000-000000000001',
   'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000501',
   'كتابة المحتوى', 'todo', 'normal', 'b4000000-0000-4000-8000-000000000305', 0,
   'b4000000-0000-4000-8000-000000000301');
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*)::integer from public.notifications
    where source_task_id = 'b4000000-0000-4000-8000-000000000701'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000305'),
  1,
  'task assignment notifies the assignee'
);

select is(
  (select count(*)::integer from public.notifications
    where source_task_id = 'b4000000-0000-4000-8000-000000000701'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000301'),
  0,
  'the assigning actor is not notified of their own assignment'
);

-- A legitimate A -> B -> A -> B reassignment cycle must create one fresh
-- notification for every assignment, while the unique key still protects a
-- replay of the same database mutation.
update public.deliverable_tasks
set assignee_user_id = 'b4000000-0000-4000-8000-000000000306',
    updated_at = '2026-08-01 10:00:01+00'
where id = 'b4000000-0000-4000-8000-000000000701';
update public.deliverable_tasks
set assignee_user_id = 'b4000000-0000-4000-8000-000000000305',
    updated_at = '2026-08-01 10:00:02+00'
where id = 'b4000000-0000-4000-8000-000000000701';
update public.deliverable_tasks
set assignee_user_id = 'b4000000-0000-4000-8000-000000000306',
    updated_at = '2026-08-01 10:00:03+00'
where id = 'b4000000-0000-4000-8000-000000000701';

select is(
  (select count(*)::integer from public.notifications
    where source_task_id = 'b4000000-0000-4000-8000-000000000701'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000305'),
  2,
  'returning a task to a former assignee creates a new notification'
);

select is(
  (select count(*)::integer from public.notifications
    where source_task_id = 'b4000000-0000-4000-8000-000000000701'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000306'),
  2,
  'each later reassignment to the same user remains observable'
);

-- ============================================================================
-- 5. Dedupe: replaying the enqueue helper with the same dedupe_key is a no-op.
-- ============================================================================
select public.s015_enqueue_notification(
  'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101',
  'b4000000-0000-4000-8000-000000000306', 'probe_event', 'عنوان', 'رسالة',
  '/portfolio', null, null, 'probe-dedupe-key-1'
);
select public.s015_enqueue_notification(
  'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000101',
  'b4000000-0000-4000-8000-000000000306', 'probe_event', 'عنوان', 'رسالة',
  '/portfolio', null, null, 'probe-dedupe-key-1'
);

select is(
  (select count(*)::integer from public.notifications
    where recipient_user_id = 'b4000000-0000-4000-8000-000000000306'
      and dedupe_key = 'probe-dedupe-key-1'),
  1,
  'duplicate dedupe_key never creates a second notification for the same recipient'
);

-- ============================================================================
-- 6. action_href allowlist CHECK rejects a non-allowlisted route on insert.
-- ============================================================================
select throws_ok(
  $$ insert into public.notifications (
      id, tenant_id, client_id, recipient_user_id, event_type, title, message,
      action_href, dedupe_key
    ) values (
      'b4000000-0000-4000-8000-000000000b01',
      'b4000000-0000-4000-8000-000000000001',
      'b4000000-0000-4000-8000-000000000101',
      'b4000000-0000-4000-8000-000000000306',
      'probe', 't', 'm', '/admin/internal-dashboard', 'bad-href-1'
    ) $$,
  '23514',
  '.*notifications_action_href_allowed.*'
);

-- ============================================================================
-- 7. RLS: a recipient reads only their own notifications.
-- ============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000302', true);
select is(
  (select count(*)::integer from public.notifications
    where recipient_user_id = 'b4000000-0000-4000-8000-000000000302'),
  (select count(*)::integer from public.notifications), -- visible rows equal own rows
  'client approver A reads exactly their own notifications (RLS)'
);
-- The viewer (303) must not see the approver's rows.
select is(
  (select count(*)::integer from public.notifications
    where recipient_user_id = 'b4000000-0000-4000-8000-000000000303'),
  0,
  'client approver A cannot read viewer A notifications'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000303', true);
select is(
  (select count(*)::integer from public.notifications),
  1,
  'viewer A reads exactly their own send-to-client notification'
);
reset role;

-- Tenant admin (301) can see their client-decision notification.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000301', true);
select is(
  (select count(*)::integer from public.notifications),
  1,
  'tenant admin sees exactly their single client-approved notification'
);
reset role;

-- ============================================================================
-- 8. Tenant / Client A vs Client B isolation: a Client B approver cannot see a
--    Client A notification even if one existed for them. Seed a Client A row
--    addressed to the Client B user (data mistake scenario) and prove RLS hides it.
-- ============================================================================
insert into public.notifications (
  id, tenant_id, client_id, recipient_user_id, event_type, title, message,
  action_href, dedupe_key
) values (
  'b4000000-0000-4000-8000-000000000c01',
  'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', -- Client A scope
  'b4000000-0000-4000-8000-000000000304', -- Client B approver
  'client_send', 'تسريب مفترض', 'لا يجب أن يظهر', '/client/pending',
  'isolation-probe-1'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000304', true);
select is(
  (select count(*)::integer from public.notifications),
  0,
  'Client B approver cannot read a Client A scoped notification (client-scope RLS)'
);
select is(
  (select count(*)::integer from public.s015_list_notifications('all', 50, 0)),
  0,
  'Client B approver cannot bypass Client A isolation through the list RPC'
);
select is(
  public.s015_notification_unread_count(),
  0,
  'Client B approver cannot count a Client A notification through the unread RPC'
);
reset role;

-- ============================================================================
-- 9. Disabled membership: a user whose tenant membership is disabled sees zero,
--    even when a notification is addressed directly to them. The active-tenant
--    membership gate inside every notifications policy is what hides it.
-- ============================================================================
insert into public.notifications (
  id, tenant_id, recipient_user_id, event_type, title, message, dedupe_key
) values (
  'b4000000-0000-4000-8000-000000000901',
  'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000307',
  'probe', 'موجّه لعضوية معطلة', 'لا يجب أن يُقرأ', 'disabled-probe-1'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000307', true);
select is(
  (select count(*)::integer from public.notifications),
  0,
  'a disabled-membership user cannot read notifications addressed to them'
);
select is(
  public.s015_notification_unread_count(),
  0,
  'a disabled-membership user has zero unread count via the scoped RPC'
);
reset role;

-- Revoking Client A membership must immediately hide old Client A rows from
-- both RLS and every SECURITY DEFINER read/write RPC, even while tenant
-- membership remains active.
insert into public.notifications (
  id, tenant_id, client_id, recipient_user_id, event_type, title, message,
  action_href, dedupe_key
) values (
  'b4000000-0000-4000-8000-000000000c02',
  'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101',
  'b4000000-0000-4000-8000-000000000302',
  'probe', 'scope probe', 'must disappear after scope revocation',
  '/client/work', 'revoked-client-scope-probe-1'
);
update public.client_memberships
set status = 'disabled'
where id = 'b4000000-0000-4000-8000-000000000211';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000302', true);
select is(
  (select count(*)::integer from public.notifications),
  0,
  'revoked client membership immediately hides previously addressed rows'
);
select is(
  (select count(*)::integer from public.s015_list_notifications('all', 50, 0)),
  0,
  'revoked client membership cannot bypass scope through the list RPC'
);
select is(
  public.s015_notification_unread_count(),
  0,
  'revoked client membership cannot count old client notifications'
);
select is(
  public.s015_mark_notification_read(
    'b4000000-0000-4000-8000-000000000c02'
  ),
  false,
  'revoked client membership cannot mutate an old notification through the mark RPC'
);
reset role;
delete from public.notifications
where id = 'b4000000-0000-4000-8000-000000000c02';
update public.client_memberships
set status = 'active'
where id = 'b4000000-0000-4000-8000-000000000211';

-- ============================================================================
-- 10. Scoped mark-read: a recipient marks their own notification read and can
--     never mark another recipient's notification (returns false, no mutation).
-- ============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000302', true);
select is(
  public.s015_mark_notification_read(
    (select id from public.notifications where recipient_user_id = 'b4000000-0000-4000-8000-000000000302' limit 1)
  ),
  true,
  'recipient marks their own notification read'
);
-- Try to mark the viewer's notification as the approver -> must be false.
select is(
  public.s015_mark_notification_read(
    (select id from public.notifications where recipient_user_id = 'b4000000-0000-4000-8000-000000000303' limit 1)
  ),
  false,
  'a recipient cannot mark another recipient''s notification read'
);
reset role;

-- The viewer's notification must still be unread.
select is(
  (select read_at is null from public.notifications
    where recipient_user_id = 'b4000000-0000-4000-8000-000000000303' limit 1),
  true,
  'the viewer notification remains unread after a cross-recipient mark attempt'
);

-- ============================================================================
-- 11. Read-only guard: read_at can be set but other columns cannot change, and
--     read_at cannot be reverted. (Tested as the owner since RLS UPDATE is
--     recipient-scoped; the guard trigger itself is the protection layer.)
-- ============================================================================
select throws_ok(
  $$ update public.notifications set title = 'tampered'
     where recipient_user_id = 'b4000000-0000-4000-8000-000000000306' $$,
  '42501',
  'notifications are read-only except for read_at'
);

-- Mark one read then attempt to revert read_at -> blocked.
update public.notifications set read_at = now()
  where recipient_user_id = 'b4000000-0000-4000-8000-000000000306'
    and dedupe_key = 'probe-dedupe-key-1';
select throws_ok(
  $$ update public.notifications set read_at = null
     where recipient_user_id = 'b4000000-0000-4000-8000-000000000306'
       and dedupe_key = 'probe-dedupe-key-1' $$,
  '42501',
  'read notifications cannot be reverted'
);

-- ============================================================================
-- 12. Unread count RPC is scoped to the caller and active membership.
-- ============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000302', true);
-- Approver 302 has one send-to-client notification and we marked it read above,
-- so unread count for 302 must be 0.
select is(
  public.s015_notification_unread_count(),
  0,
  'unread count reflects the mark-read action for the caller'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000303', true);
select is(
  public.s015_notification_unread_count(),
  1,
  'viewer 303 still has one unread send-to-client notification'
);
reset role;

-- ============================================================================
-- 13. Role-safe action routes: management opens the client workspace while a
--     pure execution contributor opens /work for the same workflow event.
-- ============================================================================
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
) values (
  'b4000000-0000-4000-8000-000000000a04', 'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000302',
  'ClientVersionDecision', 'allowed', 'deliverable_version',
  'b4000000-0000-4000-8000-000000000601', 'changes_requested'
);

select is(
  (select action_href from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a04'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000301'),
  '/clients/b4000000-0000-4000-8000-000000000101/deliverables',
  'management receives a client-workspace route for a client change request'
);
select is(
  (select action_href from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a04'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000310'),
  '/work',
  'execution contributor receives the team-work route for a client change request'
);

insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
) values (
  'b4000000-0000-4000-8000-000000000a05', 'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000101', 'b4000000-0000-4000-8000-000000000301',
  'DeliverableFinalDelivered', 'allowed', 'deliverable_version',
  'b4000000-0000-4000-8000-000000000601', 'deliver'
);

select is(
  (select action_href from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a05'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000306'),
  '/clients/b4000000-0000-4000-8000-000000000101/deliverables',
  'management receives a client-workspace route after final delivery'
);
select is(
  (select action_href from public.notifications
    where source_audit_event_id = 'b4000000-0000-4000-8000-000000000a05'
      and recipient_user_id = 'b4000000-0000-4000-8000-000000000310'),
  '/work',
  'execution contributor receives the team-work route after final delivery'
);

-- ============================================================================
-- 14. authenticated has NO direct INSERT permission (only triggers insert).
-- ============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b4000000-0000-4000-8000-000000000302', true);
select throws_ok(
  $$ insert into public.notifications (
      id, tenant_id, recipient_user_id, event_type, title, message, dedupe_key
    ) values (
      'b4000000-0000-4000-8000-000000000d01',
      'b4000000-0000-4000-8000-000000000001',
      'b4000000-0000-4000-8000-000000000302',
      'x', 't', 'm', 'direct-insert-probe'
    ) $$,
  '42501',
  'permission denied for table notifications'
);
reset role;

select * from finish();
