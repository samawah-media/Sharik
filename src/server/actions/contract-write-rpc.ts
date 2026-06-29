import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContractRecord,
  ContractStatus,
} from "@/modules/contracts/contract-repository";
import { toContractSafeSummary } from "@/modules/contracts/contract-repository";

type ContractWriteRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  name: string;
  reference: string | null;
  summary: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  idempotency_key?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

const selectSingleRow = (data: unknown): ContractWriteRow | undefined => {
  if (Array.isArray(data)) {
    return data[0] as ContractWriteRow | undefined;
  }

  return data as ContractWriteRow | undefined;
};

export const toContractRecordFromWriteRow = (
  row: ContractWriteRow,
): ContractRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  name: row.name,
  reference: row.reference ?? undefined,
  summary: row.summary ?? undefined,
  periodStart: row.period_start ?? undefined,
  periodEnd: row.period_end ?? undefined,
  status: row.status as ContractStatus,
  idempotencyKey: row.idempotency_key ?? "",
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archivedAt: row.archived_at ?? undefined,
});

export const toContractSafeSummaryFromWriteRow = (row: ContractWriteRow) =>
  toContractSafeSummary(toContractRecordFromWriteRow(row));

export const createContractViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    contractId: string;
    auditEventId: string;
    clientId: string;
    name: string;
    reference: string | null;
    summary: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    status: ContractStatus;
    idempotencyKey: string;
  };
}) => {
  const { data, error } = await supabase.rpc("f002_create_contract_context", {
    contract_id: input.contractId,
    audit_event_id: input.auditEventId,
    target_client_id: input.clientId,
    contract_name: input.name,
    contract_reference: input.reference,
    contract_summary: input.summary,
    period_start_date: input.periodStart,
    period_end_date: input.periodEnd,
    contract_status: input.status,
    idempotency_key: input.idempotencyKey,
  });

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toContractSafeSummaryFromWriteRow(row) };
};

export type { ContractWriteRow };
