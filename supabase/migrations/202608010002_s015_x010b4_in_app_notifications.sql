-- Spec 015 X010-B4: in-app notification center.
-- Additive, replayable, and does not modify any historical migration file.
--
-- Goal: a persistent, person-scoped, deduped in-app notification for each core
-- workflow event, replacing raw technical event logs on dashboards. Notifications
-- are created atomically with the existing audited PostgreSQL workflow commands:
-- the existing SECURITY DEFINER RPCs already insert a row into public.audit_events
-- inside the same transaction as the business mutation, so an AFTER INSERT trigger
-- on audit_events fans the relevant events out to the right recipients in the same
-- transaction. A second trigger on deliverable_tasks covers assignment/reassignment
-- (the audit row there targets the deliverable, not the task, so the task row is
-- the precise source of the assignee).
--
-- Security model:
--   * notifications carry tenant_id + client_id and are RLS-protected;
--   * a recipient only ever reads/updates their own rows while their tenant
--     membership is active, and a client_id-scoped notification additionally
--     requires the recipient to still hold that client scope or client role
--     (defense-in-depth so Client A can never see a Client B notification);
--   * action_href is generated server-side only and a CHECK constraint enforces a
--     fixed allowlist of routes (no browser-supplied href can ever be persisted);
--   * rows are read-only except read_at, which can only go from NULL -> now()
--     (never reverted, never mutated in other columns);
--   * the authenticated role gets SELECT + UPDATE only; INSERT/DELETE are not
--     granted. Only the two SECURITY DEFINER triggers (owned by the table owner)
--     insert notifications, via a shared enqueue helper.
--
-- No email, WhatsApp, push, cron, new dependency, or ADR is introduced here.

-- ============================================================================
-- 1. notifications table
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  client_id uuid,
  recipient_user_id uuid not null,
  event_type text not null,
  title text not null,
  message text not null,
  action_href text,
  source_audit_event_id uuid,
  source_task_id uuid,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists notifications_recipient_dedupe_uidx
  on public.notifications (recipient_user_id, dedupe_key);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_user_id, tenant_id)
  where read_at is null;

alter table public.notifications enable row level security;

-- ============================================================================
-- 2. action_href allowlist (server-generated only)
--    Enforced by CHECK so no arbitrary route can ever be persisted, regardless of
--    the writer. Allowed shapes:
--      /portfolio
--      /work
--      /client, /client/pending, /client/work, /client/files
--      /clients/{uuid}/deliverables
-- ============================================================================
create or replace function public.s015_notification_href_is_allowed(
  target_href text
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select target_href is null
    or target_href in (
      '/portfolio', '/work',
      '/client', '/client/pending', '/client/work', '/client/files'
    )
    or target_href ~ '^/clients/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/deliverables$';
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_action_href_allowed'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_action_href_allowed
      check (public.s015_notification_href_is_allowed(action_href));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_event_type_nonempty'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_event_type_nonempty
      check (btrim(event_type) <> '');
  end if;
end;
$$;

-- ============================================================================
-- 3. Shared enqueue helper (SECURITY DEFINER, owner context -> bypasses RLS).
--    Dedupes by (recipient_user_id, dedupe_key) so the same logical event can
--    never produce duplicate notifications for the same person. Audit events
--    use their immutable id; task assignment events include the persisted task
--    mutation timestamp, while idempotent command replay creates no new update.
-- ============================================================================
create or replace function public.s015_enqueue_notification(
  p_tenant_id uuid,
  p_client_id uuid,
  p_recipient_user_id uuid,
  p_event_type text,
  p_title text,
  p_message text,
  p_action_href text,
  p_source_audit_event_id uuid,
  p_source_task_id uuid,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_user_id is null then
    return;
  end if;
  if btrim(coalesce(p_title, '')) = '' or btrim(coalesce(p_message, '')) = '' then
    return;
  end if;
  insert into public.notifications (
    id, tenant_id, client_id, recipient_user_id, event_type, title, message,
    action_href, source_audit_event_id, source_task_id, dedupe_key
  )
  values (
    gen_random_uuid(), p_tenant_id, p_client_id, p_recipient_user_id,
    p_event_type, p_title, p_message, p_action_href, p_source_audit_event_id,
    p_source_task_id, p_dedupe_key
  )
  on conflict (recipient_user_id, dedupe_key) do nothing;
end;
$$;

revoke all on function public.s015_enqueue_notification(
  uuid, uuid, uuid, text, text, text, text, uuid, uuid, text
) from public, anon, authenticated;

-- ============================================================================
-- 4. Recipient resolvers. Small, focused helpers so the triggers stay readable.
--    All SECURITY DEFINER so they can read membership/role rows regardless of
--    the calling user's read scope; they return only user ids.
-- ============================================================================

-- Internal management of a client scope: tenant-level management roles, plus
-- account managers assigned to that specific client.
create or replace function public.s015_notification_client_management_recipients(
  p_tenant_id uuid,
  p_client_id uuid
)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select distinct tm.auth_user_id
  from public.role_assignments ra
  join public.tenant_memberships tm
    on tm.id = ra.membership_id
   and tm.tenant_id = ra.tenant_id
  where ra.tenant_id = p_tenant_id
    and ra.status = 'active'
    and tm.status = 'active'
    and tm.auth_user_id is not null
    and (
      (
        ra.scope_type = 'tenant'
        and ra.scope_id = p_tenant_id
        and ra.role_key in (
          'tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'
        )
      )
      or (
        ra.scope_type = 'client'
        and ra.scope_id = p_client_id
        and ra.role_key in (
          'tenant_owner', 'tenant_administrator', 'project_manager',
          'marketing_manager', 'account_manager'
        )
      )
    );
$$;

revoke all on function public.s015_notification_client_management_recipients(uuid, uuid)
  from public, anon, authenticated;

-- Assigned execution team for a deliverable: owner + contributors (client-scoped
-- execution roles only, active membership). Used for internal change requests so
-- the people who must edit the work are notified directly.
create or replace function public.s015_notification_deliverable_execution_recipients(
  p_tenant_id uuid,
  p_client_id uuid,
  p_deliverable_id uuid
)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  with candidates as (
    select d.owner_user_id as auth_user_id
    from public.deliverables d
    where d.tenant_id = p_tenant_id
      and d.client_id = p_client_id
      and d.id = p_deliverable_id
      and d.owner_user_id is not null
    union
    select unnest(coalesce(d.contributor_user_ids, array[]::uuid[]))
    from public.deliverables d
    where d.tenant_id = p_tenant_id
      and d.client_id = p_client_id
      and d.id = p_deliverable_id
  )
  select distinct c.auth_user_id
  from candidates c
  join public.tenant_memberships tm
    on tm.tenant_id = p_tenant_id
   and tm.auth_user_id = c.auth_user_id
   and tm.status = 'active'
  join public.role_assignments ra
    on ra.tenant_id = tm.tenant_id
   and ra.membership_id = tm.id
   and ra.status = 'active'
  where (
    ra.scope_type = 'tenant'
    and ra.scope_id = p_tenant_id
    and ra.role_key in (
      'tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'
    )
  ) or (
    ra.scope_type = 'client'
    and ra.scope_id = p_client_id
    and ra.role_key in (
      'tenant_owner', 'tenant_administrator', 'project_manager',
      'marketing_manager', 'account_manager', 'content_writer',
      'designer', 'performance_specialist'
    )
  );
$$;

revoke all on function public.s015_notification_deliverable_execution_recipients(uuid, uuid, uuid)
  from public, anon, authenticated;

-- Client portal members of a client (approver / viewer / admin) with an active
-- client membership + active client role. These are the only recipients of
-- client-visible notifications.
create or replace function public.s015_notification_client_portal_recipients(
  p_tenant_id uuid,
  p_client_id uuid
)
returns table (
  recipient_user_id uuid,
  can_approve boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select cm.auth_user_id,
         bool_or(ra.role_key in ('client_admin', 'client_approver')) as can_approve
  from public.client_memberships cm
  join public.tenant_memberships tm
    on tm.tenant_id = cm.tenant_id
   and tm.auth_user_id = cm.auth_user_id
   and tm.status = 'active'
  join public.role_assignments ra
    on ra.tenant_id = tm.tenant_id
   and ra.membership_id = tm.id
   and ra.scope_type = 'client'
   and ra.scope_id = cm.client_id
   and ra.role_key in ('client_admin', 'client_approver', 'client_viewer')
   and ra.status = 'active'
  where cm.tenant_id = p_tenant_id
    and cm.client_id = p_client_id
    and cm.status = 'active'
    and cm.auth_user_id is not null
  group by cm.auth_user_id;
$$;

revoke all on function public.s015_notification_client_portal_recipients(uuid, uuid)
  from public, anon, authenticated;

-- ============================================================================
-- 5. AFTER INSERT trigger on audit_events: fan the core workflow events out to
--    the right recipients. One complete definition covers all six supported
--    actions (internal submit, internal change request, send-to-client, client
--    decision approved/changes_requested, prepare delivery, final delivery).
-- ============================================================================
create or replace function public.s015_emit_workflow_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := new.action;
  v_actor uuid := new.actor_user_id;
  v_tenant uuid := new.tenant_id;
  v_client uuid := new.client_id;
  v_version uuid;
  v_deliverable_id uuid;
  v_deliverable_name text;
  v_href_management text;
  v_href_work text := '/work';
  v_recipient uuid;
  v_client_recipient uuid;
  v_client_can_approve boolean;
  v_event text;
  v_title text;
  v_message text;
  v_href text;
  v_decision text;
begin
  if new.decision <> 'allowed' then
    return null;
  end if;

  if v_action not in (
    'DeliverableVersionSubmitted',
    'DeliverableInternalChangesRequested',
    'DeliverableVersionSentToClient',
    'ClientVersionDecision',
    'DeliverablePreparedForDelivery',
    'DeliverableFinalDelivered'
  ) then
    return null;
  end if;

  if new.target_type <> 'deliverable_version' or new.target_id is null then
    return null;
  end if;

  v_version := new.target_id::uuid;

  select d.id, d.name
    into v_deliverable_id, v_deliverable_name
  from public.deliverable_versions v
  join public.deliverables d
    on d.id = v.deliverable_id
   and d.tenant_id = v.tenant_id
   and d.client_id = v.client_id
  where v.id = v_version
    and v.tenant_id = v_tenant;

  if v_deliverable_id is null then
    return null;
  end if;

  v_deliverable_name := coalesce(nullif(btrim(v_deliverable_name), ''), 'العمل');
  v_href_management := '/clients/' || v_client::text || '/deliverables';

  if v_action = 'DeliverableVersionSubmitted' then
    v_event := 'version_submitted';
    v_title := 'نسخة جديدة بانتظار المراجعة الداخلية';
    v_message := 'رفع فريق سماوة نسخة من «' || v_deliverable_name || '»، وهي الآن بانتظار مراجعة الإدارة.';
    v_href := v_href_management;
    for v_recipient in
      select * from public.s015_notification_client_management_recipients(v_tenant, v_client)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href,
          new.id, null, v_event || ':' || new.id::text
        );
      end if;
    end loop;
    return null;
  end if;

  if v_action = 'DeliverableInternalChangesRequested' then
    v_event := 'internal_changes_requested';
    v_title := 'طلبت الإدارة تعديل العمل';
    v_message := 'هناك ملاحظات داخلية على «' || v_deliverable_name || '». يرجى التعديل ثم إعادة رفع النسخة.';
    v_href := v_href_work;
    for v_recipient in
      select * from public.s015_notification_deliverable_execution_recipients(v_tenant, v_client, v_deliverable_id)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href,
          new.id, null, v_event || ':' || new.id::text
        );
      end if;
    end loop;
    return null;
  end if;

  if v_action = 'DeliverableVersionSentToClient' then
    -- Client-facing notification first (client-safe copy only).
    v_event := 'client_send';
    v_href := '/client/pending';
    for v_client_recipient, v_client_can_approve in
      select recipient_user_id, can_approve
      from public.s015_notification_client_portal_recipients(v_tenant, v_client)
    loop
      if v_client_can_approve then
        v_title := 'لديك نسخة جديدة بانتظار المراجعة';
        v_message := 'راجع «' || v_deliverable_name || '»، ثم اعتمدها أو اطلب تعديلًا.';
      else
        v_title := 'نسخة جديدة متاحة للاطلاع';
        v_message := 'يمكنك الاطلاع على «' || v_deliverable_name || '»، والقرار لدى المسؤول عن الاعتماد.';
      end if;
      if v_client_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_client_recipient, v_event, v_title, v_message, v_href,
          new.id, null, 'client_send:' || new.id::text
        );
      end if;
    end loop;
    return null;
  end if;

  if v_action = 'ClientVersionDecision' then
    v_decision := coalesce(new.reason, '');
    if v_decision = 'approved' then
      v_event := 'client_approved';
      v_title := 'اعتمد العميل العمل';
      v_message := 'اعتمد العميل «' || v_deliverable_name || '». يمكنك الآن تجهيز التسليم النهائي.';
      v_href := v_href_management;
      for v_recipient in
        select * from public.s015_notification_client_management_recipients(v_tenant, v_client)
      loop
        if v_recipient is distinct from v_actor then
          perform public.s015_enqueue_notification(
            v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href,
            new.id, null, v_event || ':' || new.id::text
          );
        end if;
      end loop;
    elsif v_decision = 'changes_requested' then
      v_event := 'client_changes_requested';
      v_title := 'طلب العميل تعديلات';
      v_message := 'طلب العميل تعديلات على «' || v_deliverable_name || '». يرجى التعديل ثم إعادة رفع النسخة.';
      for v_recipient in
        select * from public.s015_notification_client_management_recipients(v_tenant, v_client)
      loop
        if v_recipient is distinct from v_actor then
          perform public.s015_enqueue_notification(
            v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_management,
            new.id, null, v_event || ':' || new.id::text
          );
        end if;
      end loop;
      for v_recipient in
        select * from public.s015_notification_deliverable_execution_recipients(v_tenant, v_client, v_deliverable_id)
      loop
        if v_recipient is distinct from v_actor then
          perform public.s015_enqueue_notification(
            v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_work,
            new.id, null, v_event || ':' || new.id::text
          );
        end if;
      end loop;
    end if;
    return null;
  end if;

  if v_action = 'DeliverablePreparedForDelivery' then
    v_event := 'delivery_prepared';
    v_title := 'اكتملت جهوزية التسليم';
    v_message := 'أصبح «' || v_deliverable_name || '» جاهزًا للتسليم النهائي.';
    v_href := v_href_management;
    for v_recipient in
      select * from public.s015_notification_client_management_recipients(v_tenant, v_client)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href,
          new.id, null, v_event || ':' || new.id::text
        );
      end if;
    end loop;
    return null;
  end if;

  if v_action = 'DeliverableFinalDelivered' then
    v_event := 'delivered';
    v_title := 'تم التسليم النهائي';
    v_message := 'اكتمل تسليم «' || v_deliverable_name || '» للعميل.';
    for v_recipient in
      select * from public.s015_notification_client_management_recipients(v_tenant, v_client)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_management,
          new.id, null, 'delivered_internal:' || new.id::text
        );
      end if;
    end loop;
    for v_recipient in
      select * from public.s015_notification_deliverable_execution_recipients(v_tenant, v_client, v_deliverable_id)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_work,
          new.id, null, 'delivered_internal:' || new.id::text
        );
      end if;
    end loop;

    v_event := 'client_delivered';
    v_title := 'تم تسليم العمل';
    v_message := 'تم تسليم «' || v_deliverable_name || '». تجده ضمن ملفاتك النهائية.';
    v_href := '/client/files';
    for v_client_recipient, v_client_can_approve in
      select recipient_user_id, can_approve
      from public.s015_notification_client_portal_recipients(v_tenant, v_client)
    loop
      if v_client_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_client_recipient, v_event, v_title, v_message, v_href,
          new.id, null, 'client_delivered:' || new.id::text
        );
      end if;
    end loop;
    return null;
  end if;

  return null;
end;
$$;

revoke all on function public.s015_emit_workflow_notifications()
  from public, anon, authenticated;

drop trigger if exists s015_emit_workflow_notifications on public.audit_events;
create trigger s015_emit_workflow_notifications
after insert on public.audit_events
for each row
execute function public.s015_emit_workflow_notifications();

-- ============================================================================
-- 7. AFTER INSERT/UPDATE trigger on deliverable_tasks: assignment / reassignment.
--    Fires only when a non-null assignee is set or changed; never notifies the
--    actor who performed the assignment.
-- ============================================================================
create or replace function public.s015_emit_task_assignment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_assignee uuid;
  v_deliverable_name text;
  v_event text;
  v_title text;
  v_message text;
  v_is_reassign boolean;
begin
  if TG_OP = 'INSERT' then
    v_assignee := new.assignee_user_id;
    v_is_reassign := false;
  elsif TG_OP = 'UPDATE' then
    -- Only a change of assignee is interesting.
    if new.assignee_user_id is not distinct from old.assignee_user_id then
      return null;
    end if;
    v_assignee := new.assignee_user_id;
    v_is_reassign := old.assignee_user_id is not null;
  else
    return null;
  end if;

  -- No assignee, or the assignee is the person who did the action -> stay quiet.
  if v_assignee is null then
    return null;
  end if;
  if v_assignee is not distinct from v_actor then
    return null;
  end if;

  select d.name into v_deliverable_name
  from public.deliverables d
  where d.tenant_id = new.tenant_id
    and d.client_id = new.client_id
    and d.id = new.deliverable_id;

  v_deliverable_name := coalesce(nullif(btrim(v_deliverable_name), ''), 'العمل');

  if v_is_reassign then
    v_event := 'task_reassigned';
    v_title := 'تمت إعادة إسناد مهمة إليك';
    v_message := 'أُعيدت إليك مهمة «' || coalesce(nullif(btrim(new.title), ''), 'مهمة') || '» ضمن «' || v_deliverable_name || '».';
  else
    v_event := 'task_assigned';
    v_title := 'تم إسناد مهمة جديدة إليك';
    v_message := 'أُسندت إليك مهمة «' || coalesce(nullif(btrim(new.title), ''), 'مهمة') || '» ضمن «' || v_deliverable_name || '».';
  end if;

  perform public.s015_enqueue_notification(
    new.tenant_id, new.client_id, v_assignee, v_event, v_title, v_message, '/work',
    null, new.id,
    v_event || ':' || new.id::text || ':' || v_assignee::text || ':' ||
      coalesce(new.updated_at, new.created_at)::text
  );

  return null;
end;
$$;

revoke all on function public.s015_emit_task_assignment_notification()
  from public, anon, authenticated;

drop trigger if exists s015_emit_task_assignment_notification on public.deliverable_tasks;
create trigger s015_emit_task_assignment_notification
after insert or update of assignee_user_id on public.deliverable_tasks
for each row
execute function public.s015_emit_task_assignment_notification();

-- ============================================================================
-- 8. Read-only-except-read_at guard. Notifications may only have read_at set
--    (NULL -> now()), never reverted and never mutated in any other column.
-- ============================================================================
create or replace function public.s015_notification_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
     or new.client_id is distinct from old.client_id
     or new.recipient_user_id is distinct from old.recipient_user_id
     or new.event_type is distinct from old.event_type
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.action_href is distinct from old.action_href
     or new.source_audit_event_id is distinct from old.source_audit_event_id
     or new.source_task_id is distinct from old.source_task_id
     or new.dedupe_key is distinct from old.dedupe_key
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id then
    raise exception 'notifications are read-only except for read_at'
      using errcode = '42501';
  end if;

  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'read notifications cannot be reverted'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists s015_notification_guard_update on public.notifications;
create trigger s015_notification_guard_update
before update on public.notifications
for each row
execute function public.s015_notification_guard_update();

-- ============================================================================
-- 9. RLS policies. Recipient-only; active tenant membership required; and for
--    client-scoped rows the recipient must still hold that client scope / role.
-- ============================================================================
create or replace function public.s015_notification_current_user_can_access(
  p_tenant_id uuid,
  p_client_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = p_tenant_id
        and tm.auth_user_id = auth.uid()
        and tm.status = 'active'
        and (
          p_client_id is null
          or exists (
            select 1
            from public.role_assignments ra
            where ra.tenant_id = tm.tenant_id
              and ra.membership_id = tm.id
              and ra.status = 'active'
              and (
                (
                  ra.scope_type = 'tenant'
                  and ra.scope_id = p_tenant_id
                  and ra.role_key in (
                    'tenant_owner', 'tenant_administrator',
                    'project_manager', 'marketing_manager'
                  )
                )
                or (
                  ra.scope_type = 'client'
                  and ra.scope_id = p_client_id
                  and ra.role_key in (
                    'tenant_owner', 'tenant_administrator', 'project_manager',
                    'marketing_manager', 'account_manager', 'content_writer',
                    'designer', 'performance_specialist'
                  )
                )
              )
          )
          or (
            exists (
              select 1
              from public.client_memberships cm
              where cm.tenant_id = p_tenant_id
                and cm.client_id = p_client_id
                and cm.auth_user_id = auth.uid()
                and cm.status = 'active'
            )
            and exists (
              select 1
              from public.role_assignments ra
              where ra.tenant_id = tm.tenant_id
                and ra.membership_id = tm.id
                and ra.scope_type = 'client'
                and ra.scope_id = p_client_id
                and ra.role_key in ('client_admin', 'client_approver', 'client_viewer')
                and ra.status = 'active'
            )
          )
        )
    );
$$;

revoke all on function public.s015_notification_current_user_can_access(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_notification_current_user_can_access(uuid, uuid)
  to authenticated;

drop policy if exists "s015 notifications recipient select" on public.notifications;
create policy "s015 notifications recipient select"
on public.notifications
for select
to authenticated
using (
  recipient_user_id = auth.uid()
  and public.s015_notification_current_user_can_access(tenant_id, client_id)
);

drop policy if exists "s015 notifications recipient update read" on public.notifications;
create policy "s015 notifications recipient update read"
on public.notifications
for update
to authenticated
using (
  recipient_user_id = auth.uid()
  and public.s015_notification_current_user_can_access(tenant_id, client_id)
)
with check (
  recipient_user_id = auth.uid()
  and public.s015_notification_current_user_can_access(tenant_id, client_id)
);

-- ============================================================================
-- 10. Scoped RPCs for read + mark-read. These are the only paths the UI uses.
-- ============================================================================
create or replace function public.s015_notification_unread_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select count(*)::integer into v_count
  from public.notifications n
  where n.recipient_user_id = auth.uid()
    and n.read_at is null
    and public.s015_notification_current_user_can_access(n.tenant_id, n.client_id);

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.s015_notification_unread_count()
  from public, anon, authenticated;
grant execute on function public.s015_notification_unread_count()
  to authenticated;

create or replace function public.s015_list_notifications(
  p_filter text,
  p_limit integer,
  p_offset integer
)
returns table (
  id uuid,
  client_id uuid,
  event_type text,
  title text,
  message text,
  action_href text,
  read_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_filter is distinct from 'all' and p_filter is distinct from 'unread' then
    raise exception 'invalid filter' using errcode = 'P0001';
  end if;

  return query
  select n.id, n.client_id, n.event_type, n.title, n.message, n.action_href,
         n.read_at, n.created_at
  from public.notifications n
  where n.recipient_user_id = auth.uid()
    and public.s015_notification_current_user_can_access(n.tenant_id, n.client_id)
    and (p_filter is distinct from 'unread' or n.read_at is null)
  order by n.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200))
  offset greatest(0, coalesce(p_offset, 0));
end;
$$;

revoke all on function public.s015_list_notifications(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.s015_list_notifications(text, integer, integer)
  to authenticated;

create or replace function public.s015_mark_notification_read(
  p_notification_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.notifications
     set read_at = now()
   where id = p_notification_id
     and recipient_user_id = auth.uid()
     and read_at is null
     and public.s015_notification_current_user_can_access(tenant_id, client_id);

  return found;
end;
$$;

revoke all on function public.s015_mark_notification_read(uuid)
  from public, anon, authenticated;
grant execute on function public.s015_mark_notification_read(uuid)
  to authenticated;

create or replace function public.s015_mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.notifications
     set read_at = now()
   where recipient_user_id = auth.uid()
     and read_at is null
     and public.s015_notification_current_user_can_access(tenant_id, client_id);

  get diagnostics v_updated = row_count;
  return coalesce(v_updated, 0);
end;
$$;

revoke all on function public.s015_mark_all_notifications_read()
  from public, anon, authenticated;
grant execute on function public.s015_mark_all_notifications_read()
  to authenticated;

-- ============================================================================
-- 11. Grants. Authenticated may SELECT + UPDATE its own rows (RLS-scoped).
--     INSERT / DELETE are intentionally NOT granted to authenticated; only the
--     two SECURITY DEFINER triggers (table owner context) can create rows.
--     service_role bypasses RLS and is server-only (never in the browser or
--     Next.js runtime); it gets read-only access so the audited server actions
--     and the persistent test harness can assert notification outcomes without
--     exposing the table to any client. This mirrors the S015-P2-056 service-
--     role read pattern on the other late-created workspace tables.
-- ============================================================================
revoke all on public.notifications from public, anon, authenticated, service_role;
grant select, update on public.notifications to authenticated;
grant select on public.notifications to service_role;
