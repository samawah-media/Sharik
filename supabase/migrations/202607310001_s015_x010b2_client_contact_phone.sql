-- Spec 015 X010-B-2: additive client contact phone/WhatsApp column.
-- Adds primary_contact_phone to public.clients and threads it through the
-- audited client create/update RPCs and the atomic first-client onboarding RPC.
-- Purely additive: new nullable column; functions gain a defaulted parameter;
-- RLS already protects public.clients so the new column inherits isolation.

alter table public.clients
  add column if not exists primary_contact_phone text;

-- Defense-in-depth: the column accepts NULL or a compact, normalized phone
-- (optional leading +, then 7-15 digits). The application normalizes before
-- insert; this guard rejects any non-conforming value at the DB layer too.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_primary_contact_phone_format'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_primary_contact_phone_format
      check (
        primary_contact_phone is null
        or primary_contact_phone ~ '^\+?[0-9]{7,15}$'
      );
  end if;
end;
$$;

-- f001_create_client_write: signature grows from 6 params to 7 (added phone).
drop function if exists public.f001_create_client_write(uuid, uuid, text, text, text, text);

create function public.f001_create_client_write(
  client_id uuid,
  audit_event_id uuid,
  client_name text,
  client_slug text,
  new_primary_contact_name text default null,
  new_primary_contact_email text default null,
  new_primary_contact_phone text default null
)
returns table (
  id uuid,
  tenant_id uuid,
  name text,
  slug text,
  status text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  revision integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  created_client public.clients%rowtype;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();

  insert into public.clients (
    id,
    tenant_id,
    name,
    slug,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    created_by
  )
  values (
    client_id,
    actor_tenant_id,
    client_name,
    client_slug,
    new_primary_contact_name,
    new_primary_contact_email,
    new_primary_contact_phone,
    actor_user_id
  )
  returning * into created_client;

  insert into public.audit_events (
    id,
    tenant_id,
    client_id,
    actor_user_id,
    action,
    decision,
    target_type,
    target_id
  )
  values (
    audit_event_id,
    actor_tenant_id,
    created_client.id,
    actor_user_id,
    'ClientCreated',
    'allowed',
    'client',
    created_client.id::text
  );

  return query
  select
    created_client.id,
    created_client.tenant_id,
    created_client.name,
    created_client.slug,
    created_client.status,
    created_client.primary_contact_name,
    created_client.primary_contact_email,
    created_client.primary_contact_phone,
    created_client.created_by,
    created_client.created_at,
    created_client.updated_at,
    created_client.revision;
end;
$$;

-- f001_update_client_write: signature grows from 7 params to 8 (added phone).
drop function if exists public.f001_update_client_write(uuid, uuid, text, text, text, text, integer);

create function public.f001_update_client_write(
  target_client_id uuid,
  audit_event_id uuid,
  client_name text,
  client_slug text,
  new_primary_contact_name text default null,
  new_primary_contact_email text default null,
  new_primary_contact_phone text default null,
  expected_revision integer default 1
)
returns table (
  id uuid,
  tenant_id uuid,
  name text,
  slug text,
  status text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  revision integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  updated_client public.clients%rowtype;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();

  update public.clients
  set
    name = client_name,
    slug = client_slug,
    primary_contact_name = new_primary_contact_name,
    primary_contact_email = new_primary_contact_email,
    primary_contact_phone = new_primary_contact_phone,
    updated_at = now(),
    revision = public.clients.revision + 1
  where public.clients.id = target_client_id
    and public.clients.tenant_id = actor_tenant_id
    and public.clients.status = 'active'
    and public.clients.revision = expected_revision
  returning * into updated_client;

  if updated_client.id is null then
    raise exception 'client write conflict'
      using errcode = 'P0002';
  end if;

  insert into public.audit_events (
    id,
    tenant_id,
    client_id,
    actor_user_id,
    action,
    decision,
    target_type,
    target_id
  )
  values (
    audit_event_id,
    actor_tenant_id,
    updated_client.id,
    actor_user_id,
    'ClientUpdated',
    'allowed',
    'client',
    updated_client.id::text
  );

  return query
  select
    updated_client.id,
    updated_client.tenant_id,
    updated_client.name,
    updated_client.slug,
    updated_client.status,
    updated_client.primary_contact_name,
    updated_client.primary_contact_email,
    updated_client.primary_contact_phone,
    updated_client.created_by,
    updated_client.created_at,
    updated_client.updated_at,
    updated_client.revision;
end;
$$;

revoke all on function public.f001_create_client_write(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.f001_update_client_write(uuid, uuid, text, text, text, text, text, integer) from public, anon, authenticated;

grant execute on function public.f001_create_client_write(uuid, uuid, text, text, text, text, text) to authenticated;
grant execute on function public.f001_update_client_write(uuid, uuid, text, text, text, text, text, integer) to authenticated;

-- s015_onboard_first_client: add client_contact_phone_input and thread it
-- through f001_create_client_write and the payload fingerprint.
drop function if exists public.s015_onboard_first_client(
  text, uuid, uuid, text, text, text, text,
  uuid, uuid, text, text, text, date, date, text,
  uuid, uuid, text, text, date, date, jsonb,
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid, uuid[], date, date, date, date, boolean, boolean, numeric
);

create function public.s015_onboard_first_client(
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
  reserved_quantity_input numeric,
  client_contact_phone_input text default null
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
    'client_contact_phone', client_contact_phone_input,
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
    client_contact_email_input,
    client_contact_phone_input
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
  uuid, uuid[], date, date, date, date, boolean, boolean, numeric, text
) from public, anon, authenticated;

grant execute on function public.s015_onboard_first_client(
  text, uuid, uuid, text, text, text, text,
  uuid, uuid, text, text, text, date, date, text,
  uuid, uuid, text, text, date, date, jsonb,
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid, uuid[], date, date, date, date, boolean, boolean, numeric, text
) to authenticated;
