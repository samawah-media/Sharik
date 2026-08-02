-- X010-B-5 corrective pgTAP: active clients can read and download their own
-- standalone document files (contract_file / report_file / brand_asset), while
-- internal_only stays hidden, Client A/B isolation holds, disabled membership
-- denies, and cross-client download is rejected by the audited RPC.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Tenant A with Client A + Client B.
insert into public.tenants (id, name) values
  ('b5000000-0000-4000-8000-000000000001', 'B5 Doc Tenant A');

insert into public.clients (id, tenant_id, name, slug) values
  ('b5000000-0000-4000-8000-000000000101', 'b5000000-0000-4000-8000-000000000001', 'B5 Client A', 'b5-a'),
  ('b5000000-0000-4000-8000-000000000102', 'b5000000-0000-4000-8000-000000000001', 'B5 Client B', 'b5-b');

-- 301 = Client A approver; 302 = Client B approver; 303 = a later-disabled A member.
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('b5000000-0000-4000-8000-000000000201', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000301', 'active'),
  ('b5000000-0000-4000-8000-000000000202', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000302', 'active'),
  ('b5000000-0000-4000-8000-000000000203', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000303', 'active');

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
  ('b5000000-0000-4000-8000-000000000211', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'b5000000-0000-4000-8000-000000000301', 'active'),
  ('b5000000-0000-4000-8000-000000000212', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000102', 'b5000000-0000-4000-8000-000000000302', 'active'),
  ('b5000000-0000-4000-8000-000000000213', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'b5000000-0000-4000-8000-000000000303', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('b5000000-0000-4000-8000-000000000401', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000201', 'client_approver', 'client', 'b5000000-0000-4000-8000-000000000101', 'active'),
  ('b5000000-0000-4000-8000-000000000402', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000202', 'client_approver', 'client', 'b5000000-0000-4000-8000-000000000102', 'active'),
  ('b5000000-0000-4000-8000-000000000403', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000203', 'client_approver', 'client', 'b5000000-0000-4000-8000-000000000101', 'active');

-- Standalone Client A documents (no deliverable / version), plus one
-- internal_only file that must never reach a client, plus one Client B doc.
insert into public.file_assets (
  id, tenant_id, client_id, visibility, bucket_id, storage_path,
  file_type, file_size, file_name, upload_state
) values
  ('b5000000-0000-4000-8000-000000000a01', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'contract_file', 'deliverable-assets', 'b5/a/contract.pdf', 'application/pdf', 1024, 'عقد-أ.pdf', 'ready'),
  ('b5000000-0000-4000-8000-000000000a02', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'report_file', 'deliverable-assets', 'b5/a/report.pdf', 'application/pdf', 2048, 'تقرير-أ.pdf', 'ready'),
  ('b5000000-0000-4000-8000-000000000a03', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'brand_asset', 'deliverable-assets', 'b5/a/logo.png', 'image/png', 4096, 'logo.png', 'ready'),
  ('b5000000-0000-4000-8000-000000000a04', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000101', 'internal_only', 'deliverable-assets', 'b5/a/secret.txt', 'text/plain', 8, 'داخلي.txt', 'ready'),
  ('b5000000-0000-4000-8000-000000000b01', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000102', 'contract_file', 'deliverable-assets', 'b5/b/contract.pdf', 'application/pdf', 1024, 'عقد-ب.pdf', 'ready');

-- 1. Client A approver reads their three document files and never the internal one.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000301', true);
select is(
  (select count(*)::integer from public.file_assets
    where client_id = 'b5000000-0000-4000-8000-000000000101'
      and visibility in ('contract_file','report_file','brand_asset')),
  3,
  'client A approver reads their three standalone document files'
);
select is(
  (select count(*)::integer from public.file_assets
    where visibility = 'internal_only'),
  0,
  'internal_only files are never visible to a client'
);
reset role;

-- 2. Client A approver can download each document via the audited RPC.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000301', true);
select lives_ok(
  $$select * from public.s015_authorize_file_download('b5000000-0000-4000-8000-000000000a01')$$,
  'client A approver can download their contract file'
);
select lives_ok(
  $$select * from public.s015_authorize_file_download('b5000000-0000-4000-8000-000000000a02')$$,
  'client A approver can download their report file'
);
reset role;

-- 3. Client A download is audited exactly once per authorized file.
select is(
  (select count(*)::integer from public.audit_events
    where action = 'FileAccessAuthorized'
      and target_id in ('b5000000-0000-4000-8000-000000000a01','b5000000-0000-4000-8000-000000000a02')),
  2,
  'each authorized client document download records one audit event'
);

-- 4. Client B approver cannot read Client A documents (isolation).
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000302', true);
select is(
  (select count(*)::integer from public.file_assets
    where client_id = 'b5000000-0000-4000-8000-000000000101'),
  0,
  'client B approver cannot read any client A file (tenant/client isolation)'
);
select throws_ok(
  $$select * from public.s015_authorize_file_download('b5000000-0000-4000-8000-000000000a01')$$,
  '42501',
  'file download denied',
  'client B approver cannot download a client A document'
);
reset role;

-- 5. A disabled-membership client sees zero documents even though the rows exist.
update public.client_memberships
  set status = 'disabled'
  where id = 'b5000000-0000-4000-8000-000000000213';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000303', true);
select is(
  (select count(*)::integer from public.file_assets
    where client_id = 'b5000000-0000-4000-8000-000000000101'
      and visibility in ('contract_file','report_file','brand_asset')),
  0,
  'a disabled-membership client reads zero document files'
);
select throws_ok(
  $$select * from public.s015_authorize_file_download('b5000000-0000-4000-8000-000000000a03')$$,
  '42501',
  'file download denied',
  'a disabled-membership client cannot download a document'
);
reset role;

-- 6. anonymous cannot read documents.
set local role anon;
select is(
  (select count(*)::integer from public.file_assets
    where visibility in ('contract_file','report_file','brand_asset')),
  0,
  'anon cannot read document files'
);
reset role;

select * from finish();
rollback;
