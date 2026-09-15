-- Read-only UAT checkpoint. Madar fictional client only; no account/business writes.
begin transaction read only;
select jsonb_build_object(
  'ledger', (select jsonb_agg(jsonb_build_object('entry_type', entry_type, 'quantity', quantity, 'at', occurred_at)) from public.package_ledger_entries where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1' and deliverable_id = '95e821f6-0fbd-4702-a5fb-9fc56418a30b'),
  'deliverables', (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'status', status, 'progress', progress_percentage)) from public.deliverables where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1'),
  'versions', (select jsonb_agg(jsonb_build_object('id', id, 'deliverable_id', deliverable_id, 'number', version_number, 'status', status)) from public.deliverable_versions where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1'),
  'decisions', (select jsonb_agg(jsonb_build_object('version_id', version_id, 'kind', approval_kind, 'decision', decision, 'at', decided_at)) from public.approval_decisions where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1'),
  'sla', (select jsonb_agg(jsonb_build_object('kind', kind, 'started_at', started_at, 'ended_at', ended_at)) from public.sla_timeline_segments where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1'),
  'audit', (select jsonb_agg(jsonb_build_object('action', action, 'decision', decision, 'at', occurred_at)) from public.audit_events where tenant_id = '5dc5849c-8465-4226-a2ca-53f7a9307ebc' and client_id = 'c546ec7e-f65d-488f-a656-fca612f8d8c1')
) as checkpoint;
rollback;
