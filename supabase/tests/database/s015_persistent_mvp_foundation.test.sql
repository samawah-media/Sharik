begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(57);

select has_table('public', 'deliverable_versions', 'versions persist');
select has_table('public', 'approval_decisions', 'approval decisions persist');
select has_table('public', 'comments', 'comments persist');
select has_table('public', 'file_assets', 'file assets persist');
select has_table('public', 'sla_timeline_segments', 'SLA segments persist');
select has_table('public', 'mvp_command_requests', 'idempotent requests persist');

select ok((select relrowsecurity from pg_class where oid = 'public.deliverable_versions'::regclass), 'version RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.approval_decisions'::regclass), 'approval RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.comments'::regclass), 'comment RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.file_assets'::regclass), 'file RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.sla_timeline_segments'::regclass), 'SLA RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.mvp_command_requests'::regclass), 'request RLS enabled');

select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_client_decide_version(uuid,uuid,uuid,text,text,uuid,uuid,text)'::regprocedure),
  'client decision RPC is security definer'
);
select is(
  (select setting from pg_proc p cross join unnest(p.proconfig) c(setting)
   where p.oid = 'public.s015_client_decide_version(uuid,uuid,uuid,text,text,uuid,uuid,text)'::regprocedure
     and c.setting like 'search_path=%'),
  'search_path=public',
  'client decision RPC pins search_path'
);
select ok(has_function_privilege('authenticated', 'public.s015_client_decide_version(uuid,uuid,uuid,text,text,uuid,uuid,text)', 'execute'), 'authenticated can execute reviewed RPC');
select ok(not has_function_privilege('anon', 'public.s015_client_decide_version(uuid,uuid,uuid,text,text,uuid,uuid,text)', 'execute'), 'anon cannot execute RPC');
select ok(not has_table_privilege('authenticated', 'public.approval_decisions', 'insert'), 'direct approval insert denied');
select ok(not has_table_privilege('authenticated', 'public.file_assets', 'update'), 'direct file mutation denied');
select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_execute_internal_workflow(uuid,uuid,uuid,text,integer,text,uuid,uuid,text)'::regprocedure),
  'internal workflow RPC is security definer'
);
select ok(has_function_privilege('authenticated', 'public.s015_execute_internal_workflow(uuid,uuid,uuid,text,integer,text,uuid,uuid,text)', 'execute'), 'authenticated can execute internal workflow RPC');
select ok(not has_function_privilege('anon', 'public.s015_execute_internal_workflow(uuid,uuid,uuid,text,integer,text,uuid,uuid,text)', 'execute'), 'anon cannot execute internal workflow RPC');
select ok(not has_table_privilege('authenticated', 'public.deliverable_versions', 'insert'), 'direct version insert denied');
select has_table('public', 'member_profiles', 'member profiles persist');
select ok(
  has_function_privilege('authenticated', 'public.s015_client_current_version_is_visible(uuid,uuid,uuid,uuid)', 'execute'),
  'authenticated may invoke the internally authorized exact-version helper'
);
select ok(
  not has_function_privilege('anon', 'public.s015_client_current_version_is_visible(uuid,uuid,uuid,uuid)', 'execute'),
  'anonymous exact-version RPC invocation is denied'
);
select ok(
  has_function_privilege('authenticated', 'private.s015_can_read_member_profile(uuid,uuid)', 'execute'),
  'authenticated may execute the private member policy helper only through database policy evaluation'
);
select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anonymous users cannot access the private policy boundary'
);
select has_table('public', 'deliverable_tasks', 'workspace tasks persist');
select has_table('public', 'deliverable_quality_checks', 'quality checks persist');
select ok((select relrowsecurity from pg_class where oid = 'public.deliverable_tasks'::regclass), 'task RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.deliverable_quality_checks'::regclass), 'quality RLS enabled');
select ok(
  exists (select 1 from storage.buckets where id = 'deliverable-assets' and not public),
  'deliverable asset bucket is private'
);
select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_save_or_submit_version(uuid,uuid,uuid,integer,boolean,text,text,text,text,text,text,text,text,uuid,uuid,text)'::regprocedure),
  'version content command is security definer'
);
select ok(has_function_privilege('authenticated', 'public.s015_save_or_submit_version(uuid,uuid,uuid,integer,boolean,text,text,text,text,text,text,text,text,uuid,uuid,text)', 'execute'), 'authenticated can execute version content command');
select ok(not has_function_privilege('anon', 'public.s015_save_or_submit_version(uuid,uuid,uuid,integer,boolean,text,text,text,text,text,text,text,text,uuid,uuid,text)', 'execute'), 'anonymous cannot execute version content command');
select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_add_workspace_comment(uuid,uuid,uuid,text,text,jsonb,uuid,uuid,text)'::regprocedure),
  'workspace comment command is security definer'
);
select ok(has_function_privilege('authenticated', 'public.s015_add_workspace_comment(uuid,uuid,uuid,text,text,jsonb,uuid,uuid,text)', 'execute'), 'authenticated can execute workspace comment command');
select ok(not has_function_privilege('anon', 'public.s015_add_workspace_comment(uuid,uuid,uuid,text,text,jsonb,uuid,uuid,text)', 'execute'), 'anonymous cannot execute workspace comment command');
select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_register_file_asset(uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,uuid,text)'::regprocedure),
  'file registration command is security definer'
);
select ok(has_function_privilege('authenticated', 'public.s015_register_file_asset(uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,uuid,text)', 'execute'), 'authenticated can register authorized file metadata');
select ok(not has_function_privilege('anon', 'public.s015_register_file_asset(uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,uuid,text)', 'execute'), 'anonymous cannot register file metadata');
select ok(
  (select prosecdef from pg_proc where oid = 'public.s015_authorize_file_download(uuid)'::regprocedure),
  'file download authorization is security definer'
);
select ok(has_function_privilege('authenticated', 'public.s015_authorize_file_download(uuid)', 'execute'), 'authenticated can request authorized file downloads');
select ok(not has_function_privilege('anon', 'public.s015_authorize_file_download(uuid)', 'execute'), 'anonymous cannot request file downloads');
select ok(has_function_privilege('authenticated', 'public.s015_list_task_eligible_assignees(uuid,uuid)', 'execute'), 'authenticated can call the management-gated assignee directory');
select ok(not has_function_privilege('anon', 'public.s015_list_task_eligible_assignees(uuid,uuid)', 'execute'), 'anonymous cannot call the assignee directory');
select ok(not has_function_privilege('authenticated', 'private.s015_validate_task_assignee(uuid,uuid,uuid)', 'execute'), 'authenticated callers cannot invoke the assignee-validation oracle directly');
select ok(not has_function_privilege('authenticated', 'private.s015_upsert_deliverable_task_core(uuid,uuid,uuid,text,text,text,text,uuid,date,integer,uuid,uuid,text)', 'execute'), 'authenticated callers cannot bypass the active-role task command wrapper');
select ok(has_table_privilege('service_role', 'public.member_profiles', 'INSERT'), 'service role can seed scoped member profiles for persistent acceptance');
select ok(has_table_privilege('service_role', 'public.deliverable_tasks', 'SELECT'), 'service role can assert persistent task outcomes');
select ok(has_table_privilege('service_role', 'public.deliverable_quality_checks', 'SELECT'), 'service role can assert persistent quality outcomes');
select ok(has_function_privilege('service_role', 'public.s015_import_uat_payload(uuid,uuid,uuid,uuid,text,jsonb)', 'execute'), 'service role can execute bounded UAT import');
select ok(not has_function_privilege('authenticated', 'public.s015_import_uat_payload(uuid,uuid,uuid,uuid,text,jsonb)', 'execute'), 'authenticated cannot execute UAT import');
select ok(has_function_privilege('service_role', 'public.s015_rollback_uat_import(uuid,uuid,text,boolean)', 'execute'), 'service role can execute bounded UAT rollback');
select ok(not has_function_privilege('authenticated', 'public.s015_rollback_uat_import(uuid,uuid,text,boolean)', 'execute'), 'authenticated cannot execute UAT rollback');
select ok(has_function_privilege('service_role', 'public.s015_retire_empty_uat_review_items(uuid,uuid,text)', 'execute'), 'service role can retire untouched empty UAT review items');
select ok(not has_function_privilege('authenticated', 'public.s015_retire_empty_uat_review_items(uuid,uuid,text)', 'execute'), 'authenticated cannot invoke empty UAT review retirement');

select * from finish();
rollback;
