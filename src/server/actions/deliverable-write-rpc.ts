import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DeliverableAllocationRecord,
  DeliverableAllocationStatus,
  DeliverablePriority,
  DeliverableRecord,
  DeliverableSafeSummary,
} from "@/modules/deliverables/deliverable-repository";
import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";

type DeliverableWriteRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  contract_id: string | null;
  package_id: string | null;
  package_line_id: string | null;
  name: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  owner_user_id: string | null;
  contributor_user_ids: string[] | null;
  start_date: string | null;
  internal_due_date: string | null;
  client_due_date: string | null;
  final_due_date: string | null;
  requires_internal_approval: boolean;
  requires_client_approval: boolean;
  progress_percentage: number | string;
  approved_extra: boolean;
  extra_reason?: string | null;
  idempotency_key?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  revision: number | null;
};

type DeliverableAllocationRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  deliverable_id: string;
  package_line_id: string;
  reserved_quantity: number | string;
  status: string;
  reservation_ledger_entry_id: string;
  release_ledger_entry_id: string | null;
  created_at: string;
  released_at: string | null;
};

const selectSingleRow = (data: unknown): DeliverableWriteRow | undefined => {
  if (Array.isArray(data)) {
    return data[0] as DeliverableWriteRow | undefined;
  }

  return data as DeliverableWriteRow | undefined;
};

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);

export const toDeliverableRecordFromWriteRow = (
  row: DeliverableWriteRow,
): DeliverableRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  contractId: row.contract_id ?? undefined,
  packageId: row.package_id ?? undefined,
  packageLineId: row.package_line_id ?? undefined,
  name: row.name,
  description: row.description ?? undefined,
  type: row.type,
  status: row.status as DeliverableLifecycleStatus,
  priority: row.priority as DeliverablePriority,
  ownerUserId: row.owner_user_id ?? undefined,
  contributorUserIds: row.contributor_user_ids ?? [],
  startDate: row.start_date ?? undefined,
  internalDueDate: row.internal_due_date ?? undefined,
  clientDueDate: row.client_due_date ?? undefined,
  finalDueDate: row.final_due_date ?? undefined,
  requiresInternalApproval: row.requires_internal_approval,
  requiresClientApproval: row.requires_client_approval,
  progressPercentage: toNumber(row.progress_percentage),
  approvedExtra: row.approved_extra,
  extraReason: row.extra_reason ?? undefined,
  idempotencyKey: row.idempotency_key ?? "",
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  cancelledAt: row.cancelled_at ?? undefined,
  revision: row.revision ?? 1,
});

export const toDeliverableAllocationRecordFromRow = (
  row: DeliverableAllocationRow,
): DeliverableAllocationRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  deliverableId: row.deliverable_id,
  packageLineId: row.package_line_id,
  reservedQuantity: toNumber(row.reserved_quantity),
  status: row.status as DeliverableAllocationStatus,
  reservationLedgerEntryId: row.reservation_ledger_entry_id,
  releaseLedgerEntryId: row.release_ledger_entry_id ?? undefined,
  createdAt: row.created_at,
  releasedAt: row.released_at ?? undefined,
});

export const toDeliverableSafeSummaryFromRows = ({
  deliverableRow,
  allocationRows,
}: {
  deliverableRow: DeliverableWriteRow;
  allocationRows: DeliverableAllocationRow[];
}): DeliverableSafeSummary => {
  const deliverable = toDeliverableRecordFromWriteRow(deliverableRow);
  const reservation = allocationRows
    .map(toDeliverableAllocationRecordFromRow)
    .find((allocation) => allocation.status === "reserved");

  return {
    id: deliverable.id,
    tenantId: deliverable.tenantId,
    clientId: deliverable.clientId,
    contractId: deliverable.contractId,
    packageId: deliverable.packageId,
    packageLineId: deliverable.packageLineId,
    name: deliverable.name,
    description: deliverable.description,
    type: deliverable.type,
    status: deliverable.status,
    priority: deliverable.priority,
    ownerUserId: deliverable.ownerUserId,
    contributorUserIds: deliverable.contributorUserIds,
    startDate: deliverable.startDate,
    internalDueDate: deliverable.internalDueDate,
    clientDueDate: deliverable.clientDueDate,
    finalDueDate: deliverable.finalDueDate,
    requiresInternalApproval: deliverable.requiresInternalApproval,
    requiresClientApproval: deliverable.requiresClientApproval,
    progressPercentage: deliverable.progressPercentage,
    approvedExtra: deliverable.approvedExtra,
    createdAt: deliverable.createdAt,
    updatedAt: deliverable.updatedAt,
    reservation: reservation
      ? {
          packageLineId: reservation.packageLineId,
          reservedQuantity: reservation.reservedQuantity,
        }
      : undefined,
  };
};

export const createDeliverableViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    deliverableId: string;
    allocationId: string;
    ledgerEntryId: string;
    auditEventId: string;
    clientId: string;
    contractId: string;
    packageId: string;
    packageLineId: string;
    name: string;
    description: string | null;
    type: string;
    priority: DeliverablePriority;
    ownerUserId: string | null;
    contributorUserIds: string[];
    startDate: string | null;
    internalDueDate: string | null;
    clientDueDate: string | null;
    finalDueDate: string | null;
    requiresInternalApproval: boolean;
    requiresClientApproval: boolean;
    reservedQuantity: number;
    idempotencyKey: string;
  };
}) => {
  const { data, error } = await supabase.rpc("f002_create_deliverable_reservation", {
    deliverable_id: input.deliverableId,
    allocation_id: input.allocationId,
    ledger_entry_id: input.ledgerEntryId,
    audit_event_id: input.auditEventId,
    target_client_id: input.clientId,
    target_contract_id: input.contractId,
    target_package_id: input.packageId,
    target_package_line_id: input.packageLineId,
    deliverable_name: input.name,
    deliverable_description: input.description,
    deliverable_type: input.type,
    deliverable_priority: input.priority,
    owner_user_id_input: input.ownerUserId,
    contributor_user_ids_input: input.contributorUserIds,
    start_on: input.startDate,
    internal_due_on: input.internalDueDate,
    client_due_on: input.clientDueDate,
    final_due_on: input.finalDueDate,
    requires_internal_approval_input: input.requiresInternalApproval,
    requires_client_approval_input: input.requiresClientApproval,
    reserved_quantity: input.reservedQuantity,
    idempotency_key: input.idempotencyKey,
  });

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toDeliverableRecordFromWriteRow(row) };
};

export const createApprovedExtraDeliverableViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    deliverableId: string;
    auditEventId: string;
    clientId: string;
    name: string;
    description: string | null;
    type: string;
    priority: DeliverablePriority;
    ownerUserId: string | null;
    contributorUserIds: string[];
    startDate: string | null;
    internalDueDate: string | null;
    clientDueDate: string | null;
    finalDueDate: string | null;
    requiresInternalApproval: boolean;
    requiresClientApproval: boolean;
    extraReason: string;
    idempotencyKey: string;
  };
}) => {
  const { data, error } = await supabase.rpc(
    "f002_create_approved_extra_deliverable",
    {
      deliverable_id: input.deliverableId,
      audit_event_id: input.auditEventId,
      target_client_id: input.clientId,
      deliverable_name: input.name,
      deliverable_description: input.description,
      deliverable_type: input.type,
      deliverable_priority: input.priority,
      owner_user_id_input: input.ownerUserId,
      contributor_user_ids_input: input.contributorUserIds,
      start_on: input.startDate,
      internal_due_on: input.internalDueDate,
      client_due_on: input.clientDueDate,
      final_due_on: input.finalDueDate,
      requires_internal_approval_input: input.requiresInternalApproval,
      requires_client_approval_input: input.requiresClientApproval,
      extra_reason_input: input.extraReason,
      idempotency_key: input.idempotencyKey,
    },
  );

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toDeliverableRecordFromWriteRow(row) };
};

export const cancelNotStartedDeliverableViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    deliverableId: string;
    releaseLedgerEntryId: string;
    auditEventId: string;
    clientId: string;
    reason: string;
    expectedStatus: "not_started";
    expectedRevision: number | null;
    idempotencyKey: string;
  };
}) => {
  const { data, error } = await supabase.rpc(
    "f002_cancel_not_started_deliverable",
    {
      target_deliverable_id: input.deliverableId,
      release_ledger_entry_id: input.releaseLedgerEntryId,
      audit_event_id: input.auditEventId,
      target_client_id: input.clientId,
      cancellation_reason: input.reason,
      expected_status: input.expectedStatus,
      expected_revision: input.expectedRevision,
      idempotency_key: input.idempotencyKey,
    },
  );

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toDeliverableRecordFromWriteRow(row) };
};

export type { DeliverableAllocationRow, DeliverableWriteRow };
