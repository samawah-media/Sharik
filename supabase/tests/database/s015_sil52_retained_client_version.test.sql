-- SIL-52: Madar lost sent v2 when internal v3 became current (2026-09-10).
-- Standalone before/after regression: no dependency on the new read helper.
-- Automated pgTAP: NOT RUN locally. Execute only on disposable migrated DB.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

create function pg_temp.sil52_id(suffix integer) returns uuid
language sql immutable as $$
  select ('52000000-0000-4000-8000-' || lpad(suffix::text, 12, '0'))::uuid;
$$;

insert into public.tenants (id, name) values
  (pg_temp.sil52_id(1), 'SIL52 synthetic A'),
  (pg_temp.sil52_id(2), 'SIL52 synthetic B');
insert into public.clients (id, tenant_id, name, slug) values
  (pg_temp.sil52_id(301), pg_temp.sil52_id(1), 'SIL52 A', 'sil52-a'),
  (pg_temp.sil52_id(302), pg_temp.sil52_id(1), 'SIL52 B', 'sil52-b'),
  (pg_temp.sil52_id(303), pg_temp.sil52_id(2), 'SIL52 C', 'sil52-c');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
select pg_temp.sil52_id(100 + n), pg_temp.sil52_id(case when n = 4 then 2 else 1 end),
  pg_temp.sil52_id(200 + n), 'active' from generate_series(1, 5) n;
insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status)
select pg_temp.sil52_id(110 + n), pg_temp.sil52_id(case when n = 4 then 2 else 1 end),
  pg_temp.sil52_id(case n when 3 then 302 when 4 then 303 else 301 end),
  pg_temp.sil52_id(200 + n), case when n = 5 then 'disabled' else 'active' end
from generate_series(1, 5) n;
insert into public.role_assignments
  (id, tenant_id, membership_id, role_key, scope_type, scope_id, status)
select pg_temp.sil52_id(400 + n), pg_temp.sil52_id(case when n = 4 then 2 else 1 end),
  pg_temp.sil52_id(100 + n), case when n = 2 then 'client_viewer' else 'client_approver' end,
  'client', pg_temp.sil52_id(case n when 3 then 302 when 4 then 303 else 301 end), 'active'
from generate_series(1, 5) n;

insert into public.deliverables
  (id, tenant_id, client_id, name, type, status, progress_percentage,
   idempotency_key, requires_internal_approval, requires_client_approval)
values (pg_temp.sil52_id(501), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  'SIL52 retained review', 'post', 'in_progress', 30, 'sil52-retained-review', true, true);
insert into public.deliverable_versions
  (id, tenant_id, client_id, deliverable_id, version_number, status, content_body, submitted_at)
select pg_temp.sil52_id(600 + n), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(501), n, case when n = 3 then 'draft' else 'client_visible' end,
  'SIL52 version ' || n,
  -- Submission time deliberately disagrees with publication order.
  case when n = 1 then '2026-09-10 12:00Z'::timestamptz else '2026-09-10 08:00Z'::timestamptz end
from generate_series(1, 3) n;
update public.deliverables set current_version_id = pg_temp.sil52_id(602),
  status = 'waiting_client_approval' where id = pg_temp.sil52_id(501);

insert into public.member_profiles (tenant_id, user_id, display_name)
select pg_temp.sil52_id(1), pg_temp.sil52_id(900 + n), 'SIL52 author ' || n
from generate_series(1, 4) n;
insert into public.comments
  (id, tenant_id, client_id, deliverable_id, version_id, author_user_id, comment_type, visibility, body)
select pg_temp.sil52_id(700 + n), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(501), pg_temp.sil52_id(600 + case when n = 4 then 2 else n end),
  pg_temp.sil52_id(900 + n), 'internal_comment',
  case when n = 4 then 'internal_only' else 'client_visible' end, 'SIL52 comment ' || n
from generate_series(1, 4) n;
insert into public.file_assets
  (id, tenant_id, client_id, deliverable_id, version_id, owner_user_id,
   visibility, storage_path, file_type, file_size, version_number, is_final, upload_state)
select pg_temp.sil52_id(800 + n), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(501), pg_temp.sil52_id(600 + case when n > 3 then 2 else n end),
  pg_temp.sil52_id(902),
  case n when 4 then 'internal_only' when 5 then 'final_delivery' else 'client_visible' end,
  concat(pg_temp.sil52_id(1), '/', pg_temp.sil52_id(301), '/', pg_temp.sil52_id(501),
    '/', pg_temp.sil52_id(600 + case when n > 3 then 2 else n end), '/sil52-', n, '.txt'),
  'text/plain', 12, case when n > 3 then 2 else n end, n = 5,
  case when n = 6 then 'pending' else 'ready' end
from generate_series(1, 6) n;
insert into storage.objects (id, bucket_id, name, owner_id)
select id, bucket_id, storage_path, owner_user_id::text from public.file_assets
where tenant_id = pg_temp.sil52_id(1);

-- Invoker-rights assertions query the same public SELECT paths as the client.
create function pg_temp.sil52_assert_reads(expected_version integer, scenario text)
returns setof text language plpgsql as $$
begin
  return next is(
    (select count(*)::integer from public.deliverables where id = pg_temp.sil52_id(501)),
    case when expected_version is null then 0 else 1 end, scenario || ': work visibility');
  return next is(
    array(select version_number from public.deliverable_versions
      where deliverable_id = pg_temp.sil52_id(501) order by version_number),
    case when expected_version is null then array[]::integer[] else array[expected_version] end,
    scenario || ': exactly the permitted version; no older or draft content');
  return next is(
    array(select id from public.comments where deliverable_id = pg_temp.sil52_id(501) order by id),
    case when expected_version is null then array[]::uuid[]
      else array[pg_temp.sil52_id(700 + expected_version)] end,
    scenario || ': only that version client-visible comment');
  return next is(
    array(select id from public.file_assets where deliverable_id = pg_temp.sil52_id(501)
      and id <> pg_temp.sil52_id(806) order by id),
    case when expected_version is null then array[]::uuid[]
      else array[pg_temp.sil52_id(800 + expected_version)] end,
    scenario || ': no internal, old, draft or premature final files');
  return next is(
    array(select id from storage.objects where id between pg_temp.sil52_id(801) and pg_temp.sil52_id(806) order by id),
    case when expected_version is null then array[]::uuid[]
      else array[pg_temp.sil52_id(800 + expected_version)] end,
    scenario || ': Storage also excludes pending uploads');
  return next is(
    array(select user_id from public.member_profiles where tenant_id = pg_temp.sil52_id(1) order by user_id),
    case when expected_version is null then array[]::uuid[]
      else array[pg_temp.sil52_id(900 + expected_version)] end,
    scenario || ': only the visible comment author profile');
  if expected_version is null then
    return next throws_ok(
      'select public.s015_authorize_file_download(pg_temp.sil52_id(802))',
      '42501', 'file download denied', scenario || ': download RPC denies access');
  else
    return next is(
      (select count(*)::integer from public.s015_authorize_file_download(
        pg_temp.sil52_id(800 + expected_version))),
      1, scenario || ': download RPC authorizes the readable snapshot file');
  end if;
end;
$$;

create function pg_temp.sil52_assert_stale_writes(scenario text)
returns setof text language plpgsql as $$
begin
  return next throws_ok(
    $q$select public.s015_client_decide_version(pg_temp.sil52_id(301), pg_temp.sil52_id(501),
      pg_temp.sil52_id(602), 'approved', null, pg_temp.sil52_id(1001), pg_temp.sil52_id(1002),
      'sil52-stale-approval')$q$,
    'P0001', 'stale or unavailable client version', scenario || ': stale approval denied');
  return next throws_ok(
    $q$select public.s015_add_workspace_comment(pg_temp.sil52_id(301), pg_temp.sil52_id(501),
      pg_temp.sil52_id(602), 'client_visible', 'SIL52 stale write', null,
      pg_temp.sil52_id(1003), pg_temp.sil52_id(1004), 'sil52-stale-comment')$q$,
    '42501', 'comment target unavailable', scenario || ': stale comment denied');
  return next throws_ok(
    $q$select public.s015_begin_file_upload_attempt(pg_temp.sil52_id(1005), pg_temp.sil52_id(1006),
      pg_temp.sil52_id(301), pg_temp.sil52_id(501), pg_temp.sil52_id(602), 'deliverable-assets',
      concat(pg_temp.sil52_id(1), '/', pg_temp.sil52_id(301), '/', pg_temp.sil52_id(501),
        '/', pg_temp.sil52_id(602), '/stale.txt'),
      'stale.txt', 'text/plain', 12, 'client_uploaded', false, null,
      'sil52-stale-upload-run', 'sil52-stale-upload', pg_temp.sil52_id(1007))$q$,
    '42501', 'stale or cross-scope upload attempt', scenario || ': stale upload denied');
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'legacy exact-current without send audit');
reset role;

update public.deliverable_versions set status = 'final' where id = pg_temp.sil52_id(602);
update public.deliverables set status = 'ready_for_delivery' where id = pg_temp.sil52_id(501);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(2, 'legacy exact-current final without send audit');
reset role;
update public.deliverable_versions set status = 'client_visible' where id = pg_temp.sil52_id(602);

-- Missing send history must not authorize the retained fallback.
update public.deliverables set current_version_id = pg_temp.sil52_id(603),
  status = 'client_changes_requested' where id = pg_temp.sil52_id(501);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'internal v3 with no send history');
reset role;

insert into public.audit_events
  (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, occurred_at)
select pg_temp.sil52_id(1100 + n), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(902), 'DeliverableVersionSentToClient', 'allowed', 'deliverable_version',
  pg_temp.sil52_id(600 + n)::text, '2026-09-10 09:00Z'::timestamptz + n * interval '1 minute'
from generate_series(1, 2) n;
-- Newer unrelated/denied/malformed audit rows must not select v1 or v3.
insert into public.audit_events
  (id, tenant_id, client_id, action, decision, target_type, target_id, occurred_at)
values
  (pg_temp.sil52_id(1110), pg_temp.sil52_id(1), pg_temp.sil52_id(301), 'DeliverableVersionSentToClient', 'denied', 'deliverable_version', pg_temp.sil52_id(601)::text, '2026-09-10 10:00Z'),
  (pg_temp.sil52_id(1111), pg_temp.sil52_id(1), pg_temp.sil52_id(302), 'DeliverableVersionSentToClient', 'allowed', 'deliverable_version', pg_temp.sil52_id(601)::text, '2026-09-10 10:00Z'),
  (pg_temp.sil52_id(1112), pg_temp.sil52_id(2), pg_temp.sil52_id(301), 'DeliverableVersionSentToClient', 'allowed', 'deliverable_version', pg_temp.sil52_id(601)::text, '2026-09-10 10:00Z'),
  (pg_temp.sil52_id(1113), pg_temp.sil52_id(1), pg_temp.sil52_id(301), 'DeliverableVersionSentToClient', 'allowed', 'deliverable', pg_temp.sil52_id(601)::text, '2026-09-10 10:00Z'),
  (pg_temp.sil52_id(1114), pg_temp.sil52_id(1), pg_temp.sil52_id(301), 'DeliverableVersionSubmitted', 'allowed', 'deliverable_version', pg_temp.sil52_id(603)::text, '2026-09-10 10:00Z'),
  (pg_temp.sil52_id(1115), pg_temp.sil52_id(1), pg_temp.sil52_id(301), 'UnrelatedAuditEvent', 'allowed', 'deliverable_version', 'not-a-uuid', '2026-09-10 10:00Z');

update public.deliverable_versions set status = 'draft' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'client_changes_requested' where id = pg_temp.sil52_id(501);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'approver client_changes_requested');
select * from pg_temp.sil52_assert_stale_writes('client_changes_requested');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'viewer client_changes_requested');
reset role;

update public.deliverable_versions set status = 'draft' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'in_progress' where id = pg_temp.sil52_id(501);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'approver in_progress');
select * from pg_temp.sil52_assert_stale_writes('in_progress');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'viewer in_progress');
reset role;

update public.deliverable_versions set status = 'internal_only' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'ready_for_internal_review' where id = pg_temp.sil52_id(501);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'approver ready_for_internal_review');
select * from pg_temp.sil52_assert_stale_writes('ready_for_internal_review');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'viewer ready_for_internal_review');
reset role;

update public.deliverable_versions set status = 'internal_only' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'internal_changes_requested' where id = pg_temp.sil52_id(501);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'approver internal_changes_requested');
select * from pg_temp.sil52_assert_stale_writes('internal_changes_requested');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'viewer internal_changes_requested');
reset role;

update public.deliverable_versions set status = 'internally_approved' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'internally_approved' where id = pg_temp.sil52_id(501);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'approver internally_approved');
select * from pg_temp.sil52_assert_stale_writes('internally_approved');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select * from pg_temp.sil52_assert_reads(2, 'viewer internally_approved');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(202)::text, true);
select throws_ok(
  $$select public.s015_client_decide_version(pg_temp.sil52_id(301), pg_temp.sil52_id(501),
    pg_temp.sil52_id(602), 'approved', null, pg_temp.sil52_id(1010), pg_temp.sil52_id(1011),
    'sil52-viewer-approval')$$,
  '42501', 'client decision denied', 'viewer read does not grant approval');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(203)::text, true);
select * from pg_temp.sil52_assert_reads(null, 'same-tenant other client');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(204)::text, true);
select * from pg_temp.sil52_assert_reads(null, 'other tenant');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(205)::text, true);
select * from pg_temp.sil52_assert_reads(null, 'disabled client membership with active role');
reset role;

-- Revocation is checked afresh even after a successful read.
update public.role_assignments set status = 'disabled' where id = pg_temp.sil52_id(401);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select * from pg_temp.sil52_assert_reads(null, 'revoked approver role');
reset role;
update public.role_assignments set status = 'active' where id = pg_temp.sil52_id(401);

-- A readable snapshot cannot trust client-forged publication history. The
-- sentinel exception rolls back the attack even if the insert is allowed.
set local role authenticated;
select throws_ok($$do $attack$
begin
  insert into public.audit_events
    (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, occurred_at)
  values (pg_temp.sil52_id(1199), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
    pg_temp.sil52_id(902), 'DeliverableVersionSentToClient', 'allowed',
    'deliverable_version', pg_temp.sil52_id(601)::text, '2099-01-01 00:00Z');
  raise exception 'client-forged send event accepted' using errcode = 'ZX052';
end;
$attack$;$$, '42501', null, 'client cannot forge an authoritative send, even with spoofed actor');
reset role;

update public.deliverables set status = 'cancelled' where id = pg_temp.sil52_id(501);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'cancelled is not rework');
reset role;

update public.deliverables set status = 'archived' where id = pg_temp.sil52_id(501);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'archived is not rework');
reset role;

update public.deliverables set status = 'not_started' where id = pg_temp.sil52_id(501);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'not_started is not rework');
reset role;

update public.deliverables set status = 'client_changes_requested' where id = pg_temp.sil52_id(501);
-- Latest event wins even when it points to a lower-numbered version.
insert into public.audit_events (id, tenant_id, client_id, action, decision, target_type, target_id, occurred_at)
values (pg_temp.sil52_id(1120), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  'DeliverableVersionSentToClient', 'allowed', 'deliverable_version', pg_temp.sil52_id(601)::text, '2026-09-10 11:00Z');
set local role authenticated;
select * from pg_temp.sil52_assert_reads(1, 'latest send beats greatest version number and submitted_at');
reset role;
-- Equal event timestamps resolve deterministically by version number, then event ID.
insert into public.audit_events (id, tenant_id, client_id, action, decision, target_type, target_id, occurred_at)
values (pg_temp.sil52_id(1121), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  'DeliverableVersionSentToClient', 'allowed', 'deliverable_version', pg_temp.sil52_id(602)::text, '2026-09-10 11:00Z');
set local role authenticated;
select * from pg_temp.sil52_assert_reads(2, 'equal send timestamps choose one deterministic snapshot');
reset role;

-- A working version that is not newer cannot unlock historical reads.
update public.deliverable_versions set version_number = 4 where id = pg_temp.sil52_id(602);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'current internal version older than last sent');
reset role;
update public.deliverable_versions set version_number = 2 where id = pg_temp.sil52_id(602);

update public.deliverable_versions set status = 'internal_only' where id = pg_temp.sil52_id(602);
set local role authenticated;
select * from pg_temp.sil52_assert_reads(null, 'latest sent version withdrawn: do not resurrect v1');
reset role;
update public.deliverable_versions set status = 'client_visible' where id = pg_temp.sil52_id(602);

-- Resend replaces the retained snapshot; current-only command guards remain.
update public.deliverable_versions set status = 'client_visible' where id = pg_temp.sil52_id(603);
update public.deliverables set status = 'waiting_client_approval' where id = pg_temp.sil52_id(501);
insert into public.audit_events (id, tenant_id, client_id, action, decision, target_type, target_id, occurred_at)
values (pg_temp.sil52_id(1122), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  'DeliverableVersionSentToClient', 'allowed', 'deliverable_version', pg_temp.sil52_id(603)::text, '2026-09-10 12:00Z');
set local role authenticated;
select * from pg_temp.sil52_assert_reads(3, 'explicit v3 resend replaces v2');
select * from pg_temp.sil52_assert_stale_writes('after resend');
reset role;

select is((select count(*)::integer from public.approval_decisions
  where deliverable_id = pg_temp.sil52_id(501)), 0, 'denied writes left no decisions');
select is((select count(*)::integer from public.mvp_command_requests
  where deliverable_id = pg_temp.sil52_id(501)), 0, 'denied writes left no command receipts');
select is((select count(*)::integer from public.file_upload_attempts
  where deliverable_id = pg_temp.sil52_id(501)), 0, 'denied writes left no upload attempts');
select is((select count(*)::integer from public.comments
  where deliverable_id = pg_temp.sil52_id(501)), 4, 'denied writes left comments unchanged');
select is((select count(*)::integer from public.audit_events
  where id between pg_temp.sil52_id(1001) and pg_temp.sil52_id(1011)), 0,
  'denied writes left no successful decision/comment/upload audit');

-- Final files remain delivery-gated on the existing exact-current path.
update public.deliverable_versions set status = 'final' where id = pg_temp.sil52_id(603);
update public.file_assets set visibility = 'final_delivery', is_final = true where id = pg_temp.sil52_id(803);
update public.deliverables set status = 'ready_for_delivery' where id = pg_temp.sil52_id(501);
set local role authenticated;
select is((select count(*)::integer from public.deliverable_versions where id = pg_temp.sil52_id(603)),
  1, 'current final version remains readable before delivery');
select is((select count(*)::integer from public.file_assets where id = pg_temp.sil52_id(803)),
  0, 'final file withheld before delivery');
select is((select count(*)::integer from storage.objects where id = pg_temp.sil52_id(803)),
  0, 'final object withheld before delivery');
reset role;
update public.deliverables set status = 'delivered' where id = pg_temp.sil52_id(501);
set local role authenticated;
select is((select count(*)::integer from public.file_assets where id = pg_temp.sil52_id(803)),
  1, 'current final file available after delivery');
select is((select count(*)::integer from storage.objects where id = pg_temp.sil52_id(803)),
  1, 'current final object available after delivery');
reset role;

-- Positive control through the actual SECURITY DEFINER workflow, not fixture
-- insertion. Direct publication writes stay denied even for management.
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values (pg_temp.sil52_id(106), pg_temp.sil52_id(1), pg_temp.sil52_id(206), 'active');
insert into public.role_assignments
  (id, tenant_id, membership_id, role_key, scope_type, scope_id, status)
values (pg_temp.sil52_id(406), pg_temp.sil52_id(1), pg_temp.sil52_id(106),
  'tenant_administrator', 'tenant', pg_temp.sil52_id(1), 'active');
insert into public.deliverables
  (id, tenant_id, client_id, name, type, status, progress_percentage,
   idempotency_key, requires_internal_approval, requires_client_approval)
values (pg_temp.sil52_id(502), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  'SIL52 trusted send', 'post', 'in_progress', 30, 'sil52-trusted-send', true, true);
insert into public.deliverable_versions
  (id, tenant_id, client_id, deliverable_id, version_number, status, content_body)
values (pg_temp.sil52_id(604), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(502), 1, 'internally_approved', 'SIL52 approved public payload');
update public.deliverables set current_version_id = pg_temp.sil52_id(604),
  status = 'internally_approved' where id = pg_temp.sil52_id(502);

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(206)::text, true);
select throws_ok($$do $attack$
begin
  insert into public.audit_events
    (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id)
  values (pg_temp.sil52_id(1200), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
    pg_temp.sil52_id(206), 'DeliverableVersionSentToClient', 'allowed',
    'deliverable_version', pg_temp.sil52_id(604)::text);
  raise exception 'direct management publication accepted' using errcode = 'ZX052';
end;
$attack$;$$, '42501', null, 'management must also publish through the trusted workflow RPC');
select results_eq(
  $$select deliverable_status, version_status from public.s015_execute_internal_workflow(
    pg_temp.sil52_id(301), pg_temp.sil52_id(502), pg_temp.sil52_id(604),
    'send_to_client', null, null, pg_temp.sil52_id(1201), pg_temp.sil52_id(1202),
    'sil52-trusted-send-rpc')$$,
  $$values ('waiting_client_approval'::text, 'client_visible'::text)$$,
  'trusted send RPC still publishes the approved version');
reset role;
select is((select count(*)::integer from public.audit_events
  where id = pg_temp.sil52_id(1202) and tenant_id = pg_temp.sil52_id(1)
    and client_id = pg_temp.sil52_id(301) and actor_user_id = pg_temp.sil52_id(206)
    and action = 'DeliverableVersionSentToClient' and decision = 'allowed'
    and target_type = 'deliverable_version' and target_id = pg_temp.sil52_id(604)::text),
  1, 'trusted send atomically emits the exact authoritative scoped event');
select is((select count(*)::integer from public.mvp_command_requests
  where id = pg_temp.sil52_id(1201) and audit_event_id = pg_temp.sil52_id(1202)
    and command_name = 'send_to_client' and outcome = 'allowed'),
  1, 'trusted send preserves its successful command receipt');

insert into public.deliverable_versions
  (id, tenant_id, client_id, deliverable_id, version_number, status, content_body)
values (pg_temp.sil52_id(605), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
  pg_temp.sil52_id(502), 2, 'draft', 'SIL52 internal follow-up');
update public.deliverables set current_version_id = pg_temp.sil52_id(605),
  status = 'client_changes_requested' where id = pg_temp.sil52_id(502);
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select is(array(select id from public.deliverable_versions
  where deliverable_id = pg_temp.sil52_id(502) order by id),
  array[pg_temp.sil52_id(604)], 'real RPC send remains the retained snapshot during rework');
select lives_ok($$insert into public.audit_events
  (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id)
  values (pg_temp.sil52_id(1203), pg_temp.sil52_id(1), pg_temp.sil52_id(301),
    pg_temp.sil52_id(201), 'SIL52UnrelatedAudit', 'allowed', 'client', pg_temp.sil52_id(301)::text)$$,
  'unrelated direct audit retains existing active-tenant permission');
select throws_ok($$do $attack$
begin
  insert into public.audit_events
    (id, tenant_id, action, decision, target_type, target_id)
  values (pg_temp.sil52_id(1204), pg_temp.sil52_id(2),
    'SIL52UnrelatedAudit', 'allowed', 'client', pg_temp.sil52_id(303)::text);
  raise exception 'cross-tenant audit accepted' using errcode = 'ZX052';
end;
$attack$;$$, '42501', null, 'unrelated audit cannot bypass the existing tenant check');
reset role;

-- Mixed staff/client roles intentionally retain broader staff RLS. Client
-- projection must use the explicit RPC, not number-desc over those rows.
insert into public.role_assignments
  (id, tenant_id, membership_id, role_key, scope_type, scope_id, status)
values (pg_temp.sil52_id(407), pg_temp.sil52_id(1), pg_temp.sil52_id(101),
  'content_writer', 'client', pg_temp.sil52_id(301), 'active');
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(201)::text, true);
select is((select count(*)::integer from public.deliverable_versions
  where deliverable_id = pg_temp.sil52_id(501)
    and status in ('client_visible', 'client_approved', 'final')),
  3, 'mixed role has multiple public versions through permissive staff RLS');
-- lives_ok catches missing-RPC errors in the pre-migration RED run, while the
-- DO assertions validate actual returned identities, not function presence.
select lives_ok($$do $probe$
begin
  if array(select version_id from public.s015_client_readable_versions(
      pg_temp.sil52_id(1), pg_temp.sil52_id(301),
      array[pg_temp.sil52_id(501), pg_temp.sil52_id(502), pg_temp.sil52_id(501)])
      order by deliverable_id)
    is distinct from array[pg_temp.sil52_id(603), pg_temp.sil52_id(604)] then
    raise exception 'mixed-role RPC returned wrong, duplicate, or extra snapshots';
  end if;
end;
$probe$;$$, 'mixed-role client RPC returns only designated current/retained snapshots');
select lives_ok($$do $probe$
begin
  if exists (select 1 from public.s015_client_readable_versions(
      pg_temp.sil52_id(1), pg_temp.sil52_id(302), array[pg_temp.sil52_id(501)]))
    or exists (select 1 from public.s015_client_readable_versions(
      pg_temp.sil52_id(2), pg_temp.sil52_id(301), array[pg_temp.sil52_id(501)]))
    or exists (select 1 from public.s015_client_readable_versions(
      pg_temp.sil52_id(1), pg_temp.sil52_id(301), array[pg_temp.sil52_id(9999)])) then
    raise exception 'RPC exposed a wrong-scope or nonexistent work';
  end if;
end;
$probe$;$$, 'selection RPC returns no identities for wrong scopes or nonexistent work');
reset role;
update public.client_memberships set status = 'disabled' where id = pg_temp.sil52_id(111);
set local role authenticated;
select lives_ok($$do $probe$
begin
  if exists (select 1 from public.s015_client_readable_versions(
      pg_temp.sil52_id(1), pg_temp.sil52_id(301), array[pg_temp.sil52_id(501), pg_temp.sil52_id(502)])) then
    raise exception 'staff role bypassed revoked client membership';
  end if;
end;
$probe$;$$, 'mixed-role RPC denies revoked client membership despite active staff role');
select set_config('request.jwt.claim.sub', pg_temp.sil52_id(206)::text, true);
select lives_ok($$do $probe$
begin
  if exists (select 1 from public.s015_client_readable_versions(
      pg_temp.sil52_id(1), pg_temp.sil52_id(301), array[pg_temp.sil52_id(501), pg_temp.sil52_id(502)])) then
    raise exception 'management-only actor gained client projection access';
  end if;
end;
$probe$;$$, 'selection RPC requires client membership and role, not management alone');
reset role;

select * from finish();
rollback;
