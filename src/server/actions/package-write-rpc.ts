import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PackageLineRecord,
  PackageLineStatus,
  PackageRecord,
  PackageSafeSummary,
  PackageStatus,
} from "@/modules/packages/package-repository";
import { projectPackageBalance } from "@/modules/packages/package-ledger";

type PackageWriteRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  contract_id: string;
  name: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  idempotency_key?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PackageLineRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  package_id: string;
  service_label: string;
  deliverable_type_hint: string | null;
  unit_label: string;
  committed_quantity: number | string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PackageLedgerRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  contract_id: string;
  package_id: string;
  package_line_id: string;
  deliverable_id: string | null;
  entry_type: string;
  quantity: number | string;
  reason: string | null;
  actor_user_id: string | null;
  idempotency_key: string;
  occurred_at: string;
};

const selectSingleRow = (data: unknown): PackageWriteRow | undefined => {
  if (Array.isArray(data)) {
    return data[0] as PackageWriteRow | undefined;
  }

  return data as PackageWriteRow | undefined;
};

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

export const toPackageRecordFromWriteRow = (
  row: PackageWriteRow,
): PackageRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  contractId: row.contract_id,
  name: row.name,
  periodStart: row.period_start ?? undefined,
  periodEnd: row.period_end ?? undefined,
  status: row.status as PackageStatus,
  idempotencyKey: row.idempotency_key ?? "",
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toPackageLineRecordFromRow = (
  row: PackageLineRow,
): PackageLineRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  clientId: row.client_id,
  packageId: row.package_id,
  serviceLabel: row.service_label,
  deliverableTypeHint: row.deliverable_type_hint ?? undefined,
  unitLabel: row.unit_label,
  committedQuantity: toNumber(row.committed_quantity),
  status: row.status as PackageLineStatus,
  createdBy: row.created_by ?? "system",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toProjectionEntries = (rows: PackageLedgerRow[]) =>
  rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    packageLineId: row.package_line_id,
    entryType: row.entry_type,
    quantity: toNumber(row.quantity),
    deliverableId: row.deliverable_id ?? undefined,
    reason: row.reason ?? undefined,
    occurredAt: row.occurred_at,
  })) as Parameters<typeof projectPackageBalance>[0];

export const toPackageSafeSummaryFromRows = ({
  packageRow,
  lineRows,
  ledgerRows,
}: {
  packageRow: PackageWriteRow;
  lineRows: PackageLineRow[];
  ledgerRows: PackageLedgerRow[];
}): PackageSafeSummary => {
  const packageRecord = toPackageRecordFromWriteRow(packageRow);
  const lines = lineRows.map((lineRow) => {
    const line = toPackageLineRecordFromRow(lineRow);
    const balance = projectPackageBalance(
      toProjectionEntries(
        ledgerRows.filter((entry) => entry.package_line_id === line.id),
      ),
    );

    return {
      id: line.id,
      tenantId: line.tenantId,
      clientId: line.clientId,
      packageId: line.packageId,
      serviceLabel: line.serviceLabel,
      deliverableTypeHint: line.deliverableTypeHint,
      unitLabel: line.unitLabel,
      committedQuantity: line.committedQuantity,
      status: line.status,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
      balance,
    };
  });

  return {
    id: packageRecord.id,
    tenantId: packageRecord.tenantId,
    clientId: packageRecord.clientId,
    contractId: packageRecord.contractId,
    name: packageRecord.name,
    periodStart: packageRecord.periodStart,
    periodEnd: packageRecord.periodEnd,
    status: packageRecord.status,
    createdAt: packageRecord.createdAt,
    updatedAt: packageRecord.updatedAt,
    lines,
    balances: lines.map((line) => ({
      packageLineId: line.id,
      ...line.balance,
    })),
  };
};

export const createPackageViaRpc = async ({
  supabase,
  input,
}: {
  supabase: SupabaseClient;
  input: {
    packageId: string;
    auditEventId: string;
    clientId: string;
    contractId: string;
    name: string;
    status: PackageStatus;
    periodStart: string | null;
    periodEnd: string | null;
    idempotencyKey: string;
    lines: Array<{
      id: string;
      ledgerEntryId: string;
      serviceLabel: string;
      deliverableTypeHint: string | null;
      unitLabel: string;
      committedQuantity: number;
    }>;
  };
}) => {
  const { data, error } = await supabase.rpc("f002_create_package_commitments", {
    package_id: input.packageId,
    audit_event_id: input.auditEventId,
    target_client_id: input.clientId,
    target_contract_id: input.contractId,
    package_name: input.name,
    package_status: input.status,
    period_start_date: input.periodStart,
    period_end_date: input.periodEnd,
    line_items: input.lines.map((line) => ({
      id: line.id,
      ledger_entry_id: line.ledgerEntryId,
      service_label: line.serviceLabel,
      deliverable_type_hint: line.deliverableTypeHint,
      unit_label: line.unitLabel,
      committed_quantity: line.committedQuantity,
    })),
    idempotency_key: input.idempotencyKey,
  });

  if (error) {
    return { ok: false as const, error };
  }

  const row = selectSingleRow(data);

  if (!row) {
    return { ok: false as const, error: { code: "PGRST116" } };
  }

  return { ok: true as const, value: toPackageRecordFromWriteRow(row) };
};

export type { PackageLedgerRow, PackageLineRow, PackageWriteRow };
