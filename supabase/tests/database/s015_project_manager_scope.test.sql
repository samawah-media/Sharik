-- TP21-2: authenticated PM scope, invitations and member administration boundaries.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
insert into public.tenants (id, name) values
  ('18000000-0000-4000-8000-000000000001', 'Lifecycle Tenant'),
  ('18000000-0000-4000-8000-000000000002', 'Other Tenant'),
  ('18000000-0000-4000-8000-000000000003', 'Tenant Without Clients');
insert into public.clients (id, tenant_id, name, slug) values
  ('18000000-0000-4000-8000-000000000101', '18000000-0000-4000-8000-000000000001', 'عميل ألف', 'd18-a'),
  ('18000000-0000-4000-8000-000000000102', '18000000-0000-4000-8000-000000000001', 'عميل باء', 'd18-b'),
  ('18000000-0000-4000-8000-000000000103', '18000000-0000-4000-8000-000000000002', 'عميل آخر', 'd18-other');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('18000000-0000-4000-8000-000000000201', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000301', 'active'),
  ('18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000302', 'active'),
  ('18000000-0000-4000-8000-000000000203', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000303', 'active'),
  ('18000000-0000-4000-8000-000000000204', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000304', 'active'),
  ('18000000-0000-4000-8000-000000000205', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000305', 'active'),
  ('18000000-0000-4000-8000-000000000206', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000306', 'active'),
  ('18000000-0000-4000-8000-000000000207', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000307', 'active'),
  ('18000000-0000-4000-8000-000000000208', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000307', 'active');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('18000000-0000-4000-8000-000000000401', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000201', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000001', 'active'),
  ('18000000-0000-4000-8000-000000000402', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000202', 'content_writer', 'client', '18000000-0000-4000-8000-000000000101', 'active'),
  ('18000000-0000-4000-8000-000000000403', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000203', 'tenant_owner', 'tenant', '18000000-0000-4000-8000-000000000001', 'active'),
  ('18000000-0000-4000-8000-000000000404', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000204', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000002', 'active'),
  ('18000000-0000-4000-8000-000000000405', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000205', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000003', 'active'),
  ('18000000-0000-4000-8000-000000000406', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000206', 'project_manager', 'tenant', '18000000-0000-4000-8000-000000000003', 'active'),
  ('18000000-0000-4000-8000-000000000407', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000202', 'performance_specialist', 'client', '18000000-0000-4000-8000-000000000102', 'active'),
  ('18000000-0000-4000-8000-000000000409', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000208', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000002', 'active');
insert into public.member_profiles (tenant_id, user_id, display_name) values
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000301', 'مدير الاختبار'),
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000302', 'كاتبة المحتوى'),
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000303', 'مالك احتياطي');

delete from public.role_assignments where id = '18000000-0000-4000-8000-000000000407';

insert into public.tenant_memberships(id,tenant_id,auth_user_id,status) values
('18000000-0000-4000-8000-000000000209','18000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000308','active');
insert into public.client_memberships(id,tenant_id,client_id,auth_user_id,status) values
('18000000-0000-4000-8000-000000000210','18000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000308','active');
insert into public.role_assignments(id,tenant_id,membership_id,role_key,scope_type,scope_id,status) values
('18000000-0000-4000-8000-000000000410','18000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000209','client_approver','client','18000000-0000-4000-8000-000000000101','active');
insert into public.contracts(id,tenant_id,client_id,name,status)
select gen_random_uuid(),tenant_id,id,'PM test contract','active' from public.clients;
insert into public.packages(id,tenant_id,client_id,contract_id,name,status)
select gen_random_uuid(),tenant_id,client_id,id,'PM test package','active' from public.contracts;
insert into public.package_lines(id,tenant_id,client_id,package_id,service_label,unit_label,committed_quantity)
select gen_random_uuid(),tenant_id,client_id,id,'Posts','post',10 from public.packages;
insert into public.contract_amendments(id,tenant_id,client_id,contract_id,version_number,change_type)
select gen_random_uuid(),tenant_id,client_id,id,1,'initial' from public.contracts;
insert into public.package_ledger_entries(id,tenant_id,client_id,contract_id,package_id,package_line_id,entry_type,quantity,idempotency_key)
select gen_random_uuid(),l.tenant_id,l.client_id,p.contract_id,p.id,l.id,'commitment_added',10,'tp21-commit-'||l.id
from public.package_lines l join public.packages p on p.id=l.package_id;
insert into public.deliverables(id,tenant_id,client_id,name,type,owner_user_id)
select case when id='18000000-0000-4000-8000-000000000101' then '18000000-0000-4000-8000-000000000902'::uuid else gen_random_uuid() end,tenant_id,id,'PM scope item','post',
case when id = '18000000-0000-4000-8000-000000000101' then '18000000-0000-4000-8000-000000000303'::uuid else null end
from public.clients;
set local role authenticated;
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000301',true);
select is(public.s015_update_internal_member_assignment(
'18000000-0000-4000-8000-000000000202','18000000-0000-4000-8000-000000000402',
'project_manager','client','18000000-0000-4000-8000-000000000101','Assign PM',gen_random_uuid(),'tp21-assign-pm'),
'updated','admin assigns PM to one client');
select throws_ok($$select public.s015_update_internal_member_assignment(
'18000000-0000-4000-8000-000000000202','18000000-0000-4000-8000-000000000402',
'project_manager','tenant','18000000-0000-4000-8000-000000000001','Broaden PM',gen_random_uuid(),'tp21-broaden-pm')$$,
'42501','role scope denied','PM cannot be assigned new tenant-wide authority');
select lives_ok($$select * from public.s015_invite_internal_team_member_v3(
'Trial manager','pm@example.test','project_manager',array['18000000-0000-4000-8000-000000000101'::uuid],
repeat('x',48),gen_random_uuid(),gen_random_uuid(),'tp21-invite-pm')$$,'admin invites PM for selected client');
select is((select count(*)::integer from public.invitations where role_key='project_manager'),1,'PM invitation persists');
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000302',true);
select is((select count(*)::integer from public.clients),1,'PM sees only assigned client');
select is((select count(*)::integer from public.contracts),1,'PM reads only assigned contract');
select is((select count(*)::integer from public.deliverables),1,'PM reads assigned-client work without owner requirement');
select is((select count(*)::integer from public.packages),1,'PM sees only assigned packages');
select is((select count(*)::integer from public.package_lines),1,'PM sees only assigned package lines');
select is((select count(*)::integer from public.contract_amendments),1,'PM sees only assigned amendments');
select is((select count(*)::integer from public.package_ledger_entries),1,'PM sees only assigned ledger');
select lives_ok($$select * from public.f002_create_deliverable_reservation(
 deliverable_id=>'18000000-0000-4000-8000-000000000901',allocation_id=>gen_random_uuid(),
 ledger_entry_id=>gen_random_uuid(),audit_event_id=>gen_random_uuid(),
 target_client_id=>'18000000-0000-4000-8000-000000000101',
 target_contract_id=>(select id from public.contracts limit 1),
 target_package_id=>(select id from public.packages limit 1),
 target_package_line_id=>(select id from public.package_lines limit 1),
 deliverable_name=>'PM ordinary work',deliverable_type=>'post',idempotency_key=>'tp21-create-work')$$,
 'PM creates an ordinary reserved deliverable');
select is((select count(*)::integer from public.deliverable_allocations),1,'PM reads own-client allocation');
select lives_ok($$select * from public.f002_cancel_not_started_deliverable(
 '18000000-0000-4000-8000-000000000901',gen_random_uuid(),gen_random_uuid(),
 '18000000-0000-4000-8000-000000000101','Cancel trial work','not_started',1,'tp21-cancel-work')$$,
 'PM cancels ordinary not-started work');
select is((select status from public.deliverables where id='18000000-0000-4000-8000-000000000901'),'cancelled','cancellation persists');
select throws_ok($$select * from public.f002_create_approved_extra_deliverable(
 deliverable_id=>gen_random_uuid(),audit_event_id=>gen_random_uuid(),target_client_id=>'18000000-0000-4000-8000-000000000101',
 deliverable_name=>'Denied extra',deliverable_type=>'post',extra_reason_input=>'Denied extra reason',idempotency_key=>'tp21-extra-denied')$$,
 '42501','not authorized','PM cannot create approved extras');
select throws_ok($$select * from public.f002_create_deliverable_reservation(
 gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),
 '18000000-0000-4000-8000-000000000102',null,null,null,'Denied cross-client',deliverable_type=>'post',idempotency_key=>'tp21-cross-client')$$,
 '42501','not authorized','PM cannot create work for another client');
select ok(private.s015_can_read_member_profile('18000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000303'),'PM reads assigned work owner profile');
select ok(not private.s015_can_read_member_profile('18000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000301'),'PM cannot read unrelated same-tenant profile');
select ok(not private.s015_can_read_member_profile('18000000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000304'),'PM cannot read cross-tenant profile');
select lives_ok($$select public.s015_upsert_deliverable_task(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902',gen_random_uuid(),
'Prepare trial content',null,'todo','normal','18000000-0000-4000-8000-000000000303',null,0,
gen_random_uuid(),gen_random_uuid(),'tp21-assign-task')$$,'PM assigns work in scoped client');
select lives_ok($$select * from public.s015_save_or_submit_version(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',1,true,
'Trial brief','Real review content for a scoped project manager',null,null,null,null,null,null,
gen_random_uuid(),gen_random_uuid(),'tp21-submit-version')$$,'PM submits version without owning the work');
select lives_ok($$select * from public.s015_execute_internal_workflow(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'approve_internal',null,null,gen_random_uuid(),gen_random_uuid(),'tp21-approve-internal')$$,'PM internally approves scoped version');
select lives_ok($$select * from public.s015_execute_internal_workflow(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'send_to_client',null,null,gen_random_uuid(),gen_random_uuid(),'tp21-send-client')$$,'PM sends approved scoped version');
select is((select kind from public.sla_timeline_segments where deliverable_id='18000000-0000-4000-8000-000000000902' and ended_at is null),
'paused_waiting_client','PM send preserves client-wait SLA pause');
select throws_ok($$select * from public.s015_client_decide_version(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'approved',null,gen_random_uuid(),gen_random_uuid(),'tp21-deny-client-decision')$$,'42501','client decision denied','PM cannot impersonate client approval');
select throws_ok($$select * from public.s015_execute_internal_workflow(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'deliver',null,null,gen_random_uuid(),gen_random_uuid(),'tp21-deny-early-delivery')$$,
'P0001','client approval required for same version','PM cannot bypass client approval for delivery');
select throws_ok($$select * from public.s015_list_internal_team_members()$$,'42501','not authorized','PM cannot administer members');
select throws_ok($$select * from public.s015_invite_internal_team_member_v3(
'Forbidden invite','denied@example.test','designer',array['18000000-0000-4000-8000-000000000101'::uuid],
repeat('y',48),gen_random_uuid(),gen_random_uuid(),'tp21-deny-invite')$$,'42501','team invitation denied','PM cannot invite users');
select throws_ok($$select public.s015_update_internal_member_assignment(
'18000000-0000-4000-8000-000000000202','18000000-0000-4000-8000-000000000402',
'designer','client','18000000-0000-4000-8000-000000000101','Escalate own role',gen_random_uuid(),'tp21-deny-edit')$$,
'42501','not authorized','PM cannot change roles');
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000308',true);
select lives_ok($$select * from public.s015_client_decide_version(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'approved',null,gen_random_uuid(),gen_random_uuid(),'tp21-client-approved')$$,'real client persona approves sent version');
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000302',true);
select lives_ok($$select * from public.s015_execute_internal_workflow(
'18000000-0000-4000-8000-000000000101','18000000-0000-4000-8000-000000000902','18000000-0000-4000-8000-000000000903',
'deliver',null,null,gen_random_uuid(),gen_random_uuid(),'tp21-complete-delivery')$$,'PM delivers after real client approval');
select is((select status from public.deliverables where id='18000000-0000-4000-8000-000000000902'),'delivered','PM delivery persists');
reset role;
select is((select count(*)::integer from public.audit_events where actor_user_id='18000000-0000-4000-8000-000000000302' and action in ('DeliverableVersionInternallyApproved','DeliverableVersionSentToClient','DeliverableFinalDelivered')),3,'PM approval/send/delivery emit audit records');
update public.tenant_memberships set status='disabled' where id='18000000-0000-4000-8000-000000000202';
set local role authenticated;
select is((select count(*)::integer from public.clients),0,'disabled PM loses client reads');
select is((select count(*)::integer from public.contracts),0,'disabled PM loses contract reads');
select * from finish();
rollback;
