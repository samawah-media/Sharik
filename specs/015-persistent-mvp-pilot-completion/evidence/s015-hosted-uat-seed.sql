-- S015 Hosted UAT synthetic seed.
-- Non-production UAT only. Creates run-scoped synthetic public records.
-- Does not create Auth users, passwords, tokens, or real client data.

with scope as (
  select
    c.tenant_id,
    c.id as client_id,
    (select u.id from auth.users u order by u.created_at asc limit 1) as actor_id
  from public.clients c
  where c.status = 'active'
  order by c.created_at asc
  limit 1
),
contract_seed as (
  insert into public.contracts (
    id,
    tenant_id,
    client_id,
    name,
    reference,
    summary,
    period_start,
    period_end,
    status,
    created_by
  )
  select
    '01501501-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    'S015 Hosted UAT Contract',
    'S015-HOSTED-UAT-20260712',
    'Synthetic hosted UAT contract.',
    current_date,
    current_date + 30,
    'active',
    actor_id
  from scope
  on conflict (id) do update set updated_at = now()
  returning id, tenant_id, client_id
),
package_seed as (
  insert into public.packages (
    id,
    tenant_id,
    client_id,
    contract_id,
    name,
    period_start,
    period_end,
    status,
    created_by
  )
  select
    '01501502-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    id,
    'S015 Hosted UAT Package',
    current_date,
    current_date + 30,
    'active',
    (select actor_id from scope)
  from contract_seed
  on conflict (id) do update set updated_at = now()
  returning id, tenant_id, client_id, contract_id
),
line_seed as (
  insert into public.package_lines (
    id,
    tenant_id,
    client_id,
    package_id,
    service_label,
    deliverable_type_hint,
    unit_label,
    committed_quantity,
    status,
    created_by
  )
  select
    '01501503-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    id,
    'S015 Hosted UAT Deliverables',
    'post',
    'deliverable',
    3,
    'active',
    (select actor_id from scope)
  from package_seed
  on conflict (id) do update set status = excluded.status
  returning id, tenant_id, client_id, package_id
),
deliverable_seed as (
  insert into public.deliverables (
    id,
    tenant_id,
    client_id,
    contract_id,
    package_id,
    package_line_id,
    name,
    description,
    type,
    status,
    priority,
    owner_user_id,
    start_date,
    internal_due_date,
    client_due_date,
    final_due_date,
    requires_internal_approval,
    requires_client_approval,
    progress_percentage,
    created_by,
    idempotency_key
  )
  select
    '01501504-0000-4000-8000-000000000001'::uuid,
    l.tenant_id,
    l.client_id,
    p.contract_id,
    l.package_id,
    l.id,
    'S015 Hosted UAT Synthetic Deliverable',
    'Synthetic run-scoped deliverable for hosted UAT verification.',
    'post',
    'waiting_client_approval',
    'normal',
    (select actor_id from scope),
    current_date,
    current_date + 2,
    current_date + 5,
    current_date + 7,
    true,
    true,
    80,
    (select actor_id from scope),
    's015-hosted-uat-20260712-main'
  from line_seed l
  join package_seed p on p.id = l.package_id
  on conflict (id) do update
    set status = excluded.status,
        progress_percentage = excluded.progress_percentage,
        updated_at = now()
  returning id, tenant_id, client_id
),
version_seed as (
  insert into public.deliverable_versions (
    id,
    tenant_id,
    client_id,
    deliverable_id,
    version_number,
    status,
    submitted_by
  )
  select
    '01501505-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    id,
    1,
    'client_visible',
    (select actor_id from scope)
  from deliverable_seed
  on conflict (id) do update set status = excluded.status
  returning id, tenant_id, client_id, deliverable_id
),
current_version as (
  update public.deliverables d
  set current_version_id = v.id,
      updated_at = now()
  from version_seed v
  where d.id = v.deliverable_id
  returning d.id
),
file_seed as (
  insert into public.file_assets (
    id,
    tenant_id,
    client_id,
    owner_user_id,
    deliverable_id,
    version_id,
    visibility,
    file_type,
    file_size,
    storage_path,
    version_number,
    is_final
  )
  select
    '01501506-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    (select actor_id from scope),
    deliverable_id,
    id,
    'final_delivery',
    'text/plain',
    128,
    'synthetic/s015-hosted-uat-20260712/final.txt',
    1,
    true
  from version_seed
  on conflict (id) do update
    set visibility = excluded.visibility,
        is_final = excluded.is_final
  returning id
),
comment_seed as (
  insert into public.comments (
    id,
    tenant_id,
    client_id,
    deliverable_id,
    version_id,
    author_user_id,
    comment_type,
    visibility,
    body
  )
  select
    '01501507-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    deliverable_id,
    id,
    (select actor_id from scope),
    'system_comment',
    'client_visible',
    'S015 hosted UAT synthetic client-visible note.'
  from version_seed
  on conflict (id) do update set body = excluded.body
  returning id
),
sla_seed as (
  insert into public.sla_timeline_segments (
    id,
    tenant_id,
    client_id,
    deliverable_id,
    kind,
    started_at,
    reason
  )
  select
    '01501508-0000-4000-8000-000000000001'::uuid,
    tenant_id,
    client_id,
    id,
    'paused_waiting_client',
    now(),
    's015_hosted_uat_seed'
  from deliverable_seed
  on conflict (id) do update
    set kind = excluded.kind,
        reason = excluded.reason
  returning id
)
select
  's015_hosted_seed_counts' as category,
  (select count(*) from contract_seed) as contracts,
  (select count(*) from package_seed) as packages,
  (select count(*) from line_seed) as package_lines,
  (select count(*) from deliverable_seed) as deliverables,
  (select count(*) from version_seed) as versions,
  (select count(*) from file_seed) as files,
  (select count(*) from comment_seed) as comments,
  (select count(*) from sla_seed) as sla_segments;
