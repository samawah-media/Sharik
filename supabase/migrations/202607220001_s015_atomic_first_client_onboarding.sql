-- Spec 015 X009-C corrective closure: make first-client onboarding atomic and
-- establish exact client-scoped internal roles before deliverable assignment.

create table if not exists public.s015_onboarding_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  actor_user_id uuid not null,
  idempotency_key text not null check (length(btrim(idempotency_key)) >= 8),
  request_fingerprint text not null,
  client_id uuid not null references public.clients(id),
  contract_id uuid not null references public.contracts(id),
  package_id uuid not null references public.packages(id),
  deliverable_id uuid not null references public.deliverables(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

alter table public.s015_onboarding_requests enable row level security;
revoke all on table public.s015_onboarding_requests from public, anon, authenticated;

create or replace function private.s015_onboarding_member_role(
  target_tenant_id uuid,
  target_user_id uuid
)
returns table(membership_id uuid, role_key text)
language sql
security definer
set search_path = public
stable
as $$
  select tm.id, ra.role_key
  from public.tenant_memberships tm
  join public.role_assignments ra
    on ra.membership_id = tm.id
   and ra.tenant_id = tm.tenant_id
  where tm.tenant_id = target_tenant_id
    and tm.auth_user_id = target_user_id
    and tm.status = 'active'
    and ra.status = 'active'
    and ra.role_key in (
      'tenant_owner', 'tenant_administrator', 'project_manager',
      'marketing_manager', 'account_manager', 'content_writer',
      'designer', 'performance_specialist'
    )
  order by case ra.role_key
    when 'tenant_owner' then 1
    when 'tenant_administrator' then 2
    when 'project_manager' then 3
    when 'marketing_manager' then 4
    when 'account_manager' then 5
    when 'content_writer' then 6
    when 'designer' then 7
    else 8
  end
  limit 1;
$$;

revoke all on function private.s015_onboarding_member_role(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.s015_list_onboarding_team_members(
  target_tenant_id uuid
)
returns table(user_id uuid, display_name text, role_label text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  actor_tenant_id uuid;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();
  if actor_tenant_id <> target_tenant_id then
    raise exception 'onboarding team read denied' using errcode = '42501';
  end if;

  return query
  select mp.user_id, mp.display_name, coalesce(mp.role_label, eligible.role_key)
  from public.member_profiles mp
  join lateral private.s015_onboarding_member_role(
    target_tenant_id, mp.user_id
  ) eligible on true
  where mp.tenant_id = target_tenant_id
  order by mp.display_name;
end;
$$;

revoke all on function public.s015_list_onboarding_team_members(uuid)
  from public, anon, authenticated;
grant execute on function public.s015_list_onboarding_team_members(uuid)
  to authenticated;

create or replace function public.s015_onboard_first_client(
  request_idempotency_key text,
  client_id_input uuid,
  client_audit_event_id uuid,
  client_name_input text,
  client_slug_input text,
  client_contact_name_input text,
  client_contact_email_input text,
  contract_id_input uuid,
  contract_audit_event_id uuid,
  contract_name_input text,
  contract_reference_input text,
  contract_summary_input text,
  contract_period_start_input date,
  contract_period_end_input date,
  contract_status_input text,
  package_id_input uuid,
  package_audit_event_id uuid,
  package_name_input text,
  package_status_input text,
  package_period_start_input date,
  package_period_end_input date,
  package_line_items_input jsonb,
  deliverable_id_input uuid,
  allocation_id_input uuid,
  deliverable_ledger_entry_id uuid,
  deliverable_audit_event_id uuid,
  deliverable_name_input text,
  deliverable_description_input text,
  deliverable_type_input text,
  deliverable_priority_input text,
  owner_user_id_input uuid,
  contributor_user_ids_input uuid[],
  start_on_input date,
  internal_due_on_input date,
  client_due_on_input date,
  final_due_on_input date,
  requires_internal_approval_input boolean,
  requires_client_approval_input boolean,
  reserved_quantity_input numeric
)
returns table(
  result_client_id uuid,
  result_contract_id uuid,
  result_package_id uuid,
  result_deliverable_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_request_key text := nullif(btrim(request_idempotency_key), '');
  payload_fingerprint text;
  normalized_package_lines jsonb;
  existing_request public.s015_onboarding_requests%rowtype;
  created_client_id uuid;
  created_contract_id uuid;
  created_package_id uuid;
  created_deliverable_id uuid;
  first_package_line_id uuid;
  selected_user_id uuid;
  selected_membership_id uuid;
  selected_role_key text;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();

  if normalized_request_key is null or length(normalized_request_key) < 8 then
    raise exception 'invalid onboarding idempotency key' using errcode = 'P0001';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'service_label', line.value ->> 'service_label',
        'deliverable_type_hint', line.value ->> 'deliverable_type_hint',
        'unit_label', line.value ->> 'unit_label',
        'committed_quantity', line.value ->> 'committed_quantity'
      ) order by line.ordinality
    ),
    '[]'::jsonb
  ) into normalized_package_lines
  from jsonb_array_elements(package_line_items_input) with ordinality as line;

  payload_fingerprint := md5(jsonb_build_object(
    'client_name', client_name_input,
    'client_slug', client_slug_input,
    'client_contact_name', client_contact_name_input,
    'client_contact_email', client_contact_email_input,
    'contract_name', contract_name_input,
    'contract_reference', contract_reference_input,
    'contract_summary', contract_summary_input,
    'contract_period_start', contract_period_start_input,
    'contract_period_end', contract_period_end_input,
    'contract_status', contract_status_input,
    'package_name', package_name_input,
    'package_status', package_status_input,
    'package_period_start', package_period_start_input,
    'package_period_end', package_period_end_input,
    'package_lines', normalized_package_lines,
    'deliverable_name', deliverable_name_input,
    'deliverable_description', deliverable_description_input,
    'deliverable_type', deliverable_type_input,
    'deliverable_priority', deliverable_priority_input,
    'owner_user_id', owner_user_id_input,
    'contributor_user_ids', contributor_user_ids_input,
    'start_on', start_on_input,
    'internal_due_on', internal_due_on_input,
    'client_due_on', client_due_on_input,
    'final_due_on', final_due_on_input,
    'requires_internal_approval', requires_internal_approval_input,
    'requires_client_approval', requires_client_approval_input,
    'reserved_quantity', reserved_quantity_input
  )::text);

  select r.* into existing_request
  from public.s015_onboarding_requests r
  where r.tenant_id = actor_tenant_id
    and r.idempotency_key = normalized_request_key;

  if existing_request.id is not null then
    if existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'onboarding idempotency conflict' using errcode = 'P0001';
    end if;

    return query select
      existing_request.client_id,
      existing_request.contract_id,
      existing_request.package_id,
      existing_request.deliverable_id;
    return;
  end if;

  select c.id into created_client_id
  from public.f001_create_client_write(
    client_id_input,
    client_audit_event_id,
    client_name_input,
    client_slug_input,
    client_contact_name_input,
    client_contact_email_input
  ) c;

  for selected_user_id in
    select distinct u
    from unnest(
      array_remove(
        array_prepend(owner_user_id_input, coalesce(contributor_user_ids_input, '{}'::uuid[])),
        null
      )
    ) u
  loop
    selected_membership_id := null;
    selected_role_key := null;

    select eligible.membership_id, eligible.role_key
      into selected_membership_id, selected_role_key
    from private.s015_onboarding_member_role(
      actor_tenant_id, selected_user_id
    ) eligible;

    if selected_membership_id is null or selected_role_key is null then
      raise exception 'invalid onboarding team member' using errcode = '42501';
    end if;

    if not private.s015_deliverable_member_is_eligible(
      actor_tenant_id, created_client_id, selected_user_id
    ) then
      insert into public.role_assignments (
        id, tenant_id, membership_id, role_key, scope_type, scope_id, status
      ) values (
        gen_random_uuid(), actor_tenant_id, selected_membership_id,
        selected_role_key, 'client', created_client_id, 'active'
      );

      insert into public.audit_events (
        id, tenant_id, client_id, actor_user_id, action, decision,
        target_type, target_id, reason
      ) values (
        gen_random_uuid(), actor_tenant_id, created_client_id, actor_user_id,
        'RoleAssigned', 'allowed', 'membership', selected_membership_id::text,
        'first_client_onboarding'
      );
    end if;
  end loop;

  select c.id into created_contract_id
  from public.f002_create_contract_context(
    contract_id_input,
    contract_audit_event_id,
    created_client_id,
    contract_name_input,
    contract_reference_input,
    contract_summary_input,
    contract_period_start_input,
    contract_period_end_input,
    contract_status_input,
    normalized_request_key || ':contract'
  ) c;

  select p.id into created_package_id
  from public.f002_create_package_commitments(
    package_id_input,
    package_audit_event_id,
    created_client_id,
    created_contract_id,
    package_name_input,
    package_status_input,
    package_period_start_input,
    package_period_end_input,
    package_line_items_input,
    normalized_request_key || ':package'
  ) p;

  first_package_line_id := (package_line_items_input -> 0 ->> 'id')::uuid;
  if first_package_line_id is null then
    raise exception 'onboarding package line unavailable' using errcode = 'P0001';
  end if;

  select d.id into created_deliverable_id
  from public.f002_create_deliverable_reservation(
    deliverable_id_input,
    allocation_id_input,
    deliverable_ledger_entry_id,
    deliverable_audit_event_id,
    created_client_id,
    created_contract_id,
    created_package_id,
    first_package_line_id,
    deliverable_name_input,
    deliverable_description_input,
    deliverable_type_input,
    deliverable_priority_input,
    owner_user_id_input,
    contributor_user_ids_input,
    start_on_input,
    internal_due_on_input,
    client_due_on_input,
    final_due_on_input,
    requires_internal_approval_input,
    requires_client_approval_input,
    reserved_quantity_input,
    normalized_request_key || ':deliverable'
  ) d;

  insert into public.s015_onboarding_requests (
    id, tenant_id, actor_user_id, idempotency_key, request_fingerprint,
    client_id, contract_id, package_id, deliverable_id
  ) values (
    gen_random_uuid(), actor_tenant_id, actor_user_id,
    normalized_request_key, payload_fingerprint,
    created_client_id, created_contract_id, created_package_id,
    created_deliverable_id
  );

  return query select
    created_client_id,
    created_contract_id,
    created_package_id,
    created_deliverable_id;
end;
$$;

revoke all on function public.s015_onboard_first_client(
  text, uuid, uuid, text, text, text, text,
  uuid, uuid, text, text, text, date, date, text,
  uuid, uuid, text, text, date, date, jsonb,
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid, uuid[], date, date, date, date, boolean, boolean, numeric
) from public, anon, authenticated;

grant execute on function public.s015_onboard_first_client(
  text, uuid, uuid, text, text, text, text,
  uuid, uuid, text, text, text, date, date, text,
  uuid, uuid, text, text, date, date, jsonb,
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid, uuid[], date, date, date, date, boolean, boolean, numeric
) to authenticated;

grant select, insert, update, delete on public.s015_onboarding_requests
  to service_role;
