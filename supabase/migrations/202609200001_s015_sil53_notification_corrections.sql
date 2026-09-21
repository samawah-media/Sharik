-- SIL-53: forward-only notification route and business-key deduplication.
-- The original 202608010002 migration is already applied to UAT and remains immutable.

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
    or target_href ~ '^/clients/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/deliverables$'
    or target_href ~ '^/client/work/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

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
    and v.tenant_id = v_tenant
    and v.client_id = v_client;

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
          new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
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
          new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
        );
      end if;
    end loop;
    return null;
  end if;

  if v_action = 'DeliverableVersionSentToClient' then
    -- Client-facing notification first (client-safe copy only).
    v_event := 'client_send';
    v_href := '/client/work/' || v_deliverable_id::text;
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
          new.id, null, 'client_send:' || v_deliverable_id::text || ':' || v_version::text
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
            new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
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
            new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
          );
        end if;
      end loop;
      for v_recipient in
        select * from public.s015_notification_deliverable_execution_recipients(v_tenant, v_client, v_deliverable_id)
      loop
        if v_recipient is distinct from v_actor then
          perform public.s015_enqueue_notification(
            v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_work,
            new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
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
          new.id, null, v_event || ':' || v_deliverable_id::text || ':' || v_version::text
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
          new.id, null, 'delivered_internal:' || v_deliverable_id::text
        );
      end if;
    end loop;
    for v_recipient in
      select * from public.s015_notification_deliverable_execution_recipients(v_tenant, v_client, v_deliverable_id)
    loop
      if v_recipient is distinct from v_actor then
        perform public.s015_enqueue_notification(
          v_tenant, v_client, v_recipient, v_event, v_title, v_message, v_href_work,
          new.id, null, 'delivered_internal:' || v_deliverable_id::text
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
          new.id, null, 'client_delivered:' || v_deliverable_id::text
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
