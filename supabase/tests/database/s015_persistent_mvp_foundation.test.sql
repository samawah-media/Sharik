begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(22);

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

select * from finish();
rollback;
