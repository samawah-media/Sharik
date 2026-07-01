import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientCommercialSummary,
  CommercialSummary,
  ManagementCommercialSummary,
} from "@/modules/commercial/commercial-summary";
import {
  toClientDeliverableSummary,
  toManagementDeliverableSummary,
} from "@/modules/deliverables/deliverable-summary";
import {
  toDeliverableSafeSummaryFromRows,
  type DeliverableAllocationRow,
  type DeliverableWriteRow,
} from "./deliverable-write-rpc";
import {
  toContractSafeSummaryFromWriteRow,
  type ContractWriteRow,
} from "./contract-write-rpc";
import {
  toPackageSafeSummaryFromRows,
  type PackageLedgerRow,
  type PackageLineRow,
  type PackageWriteRow,
} from "./package-write-rpc";

export const fixtureManagementCommercialSummary: ManagementCommercialSummary = {
  audience: "management",
  clientId: "client_a",
  contracts: [
    {
      id: "contract_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      name: "عقد إدارة المحتوى",
      summary: "متابعة آمنة للعقد ضمن نطاق العميل.",
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
  ],
  packages: [
    {
      id: "package_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      contractId: "contract_a",
      name: "باقة المحتوى الشهرية",
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      lines: [
        {
          id: "package_line_posts_a",
          tenantId: "tenant_a",
          clientId: "client_a",
          packageId: "package_a",
          serviceLabel: "منشورات",
          unitLabel: "منشور",
          committedQuantity: 4,
          status: "active",
          createdAt: "2026-06-28T00:00:00.000Z",
          updatedAt: "2026-06-28T00:00:00.000Z",
          balance: {
            committed: 4,
            reserved: 1,
            consumed: 0,
            released: 0,
            adjustments: 0,
            available: 3,
          },
        },
      ],
      balances: [
        {
          packageLineId: "package_line_posts_a",
          committed: 4,
          reserved: 1,
          consumed: 0,
          released: 0,
          adjustments: 0,
          available: 3,
        },
      ],
    },
  ],
  deliverables: [
    {
      id: "deliverable_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      contractId: "contract_a",
      packageId: "package_a",
      packageLineId: "package_line_posts_a",
      name: "منشور إطلاق الحملة",
      description: "وصف آمن للعميل.",
      type: "post",
      status: "not_started",
      priority: "normal",
      contributorUserIds: [],
      requiresInternalApproval: true,
      requiresClientApproval: true,
      progressPercentage: 0,
      approvedExtra: false,
      revision: 1,
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      reservation: {
        packageLineId: "package_line_posts_a",
        reservedQuantity: 1,
      },
    },
  ],
};

export const fixtureClientCommercialSummary: ClientCommercialSummary = {
  audience: "client",
  contracts: fixtureManagementCommercialSummary.contracts.map((contract) => ({
    name: contract.name,
    summary: contract.summary,
    status: contract.status,
  })),
  packages: fixtureManagementCommercialSummary.packages.map((packageSummary) => ({
    name: packageSummary.name,
    status: packageSummary.status,
    lines: packageSummary.lines.map((line) => ({
      serviceLabel: line.serviceLabel,
      unitLabel: line.unitLabel,
      balance: line.balance,
    })),
  })),
  deliverables: fixtureManagementCommercialSummary.deliverables.map(
    toClientDeliverableSummary,
  ),
};

const selectContracts = async (
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
) =>
  supabase
    .from("contracts")
    .select(
      "id, tenant_id, client_id, name, reference, summary, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at, archived_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

const selectPackages = async (
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
) =>
  supabase
    .from("packages")
    .select(
      "id, tenant_id, client_id, contract_id, name, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

export const readCommercialSummary = async ({
  supabase,
  tenantId,
  clientId,
  audience,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
  audience: "management" | "client";
}): Promise<{ ok: true; value: CommercialSummary } | { ok: false }> => {
  const [contractResponse, packageResponse, deliverableResponse] =
    await Promise.all([
      selectContracts(supabase, tenantId, clientId),
      selectPackages(supabase, tenantId, clientId),
      supabase
        .from("deliverables")
        .select(
          "id, tenant_id, client_id, contract_id, package_id, package_line_id, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, idempotency_key, created_by, created_at, updated_at, cancelled_at, revision",
        )
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

  if (
    contractResponse.error ||
    packageResponse.error ||
    deliverableResponse.error
  ) {
    return { ok: false };
  }

  const packageRows = (packageResponse.data ?? []) as PackageWriteRow[];
  const deliverableRows = (deliverableResponse.data ?? []) as DeliverableWriteRow[];
  const packageIds = packageRows.map((row) => row.id);
  const deliverableIds = deliverableRows.map((row) => row.id);

  const [lineResponse, ledgerResponse, allocationResponse] = await Promise.all([
    packageIds.length > 0
      ? supabase
          .from("package_lines")
          .select(
            "id, tenant_id, client_id, package_id, service_label, deliverable_type_hint, unit_label, committed_quantity, status, created_by, created_at, updated_at",
          )
          .eq("tenant_id", tenantId)
          .eq("client_id", clientId)
          .in("package_id", packageIds)
      : Promise.resolve({ data: [], error: null }),
    packageIds.length > 0
      ? supabase
          .from("package_ledger_entries")
          .select(
            "id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key, occurred_at",
          )
          .eq("tenant_id", tenantId)
          .eq("client_id", clientId)
          .in("package_id", packageIds)
      : Promise.resolve({ data: [], error: null }),
    deliverableIds.length > 0
      ? supabase
          .from("deliverable_allocations")
          .select(
            "id, tenant_id, client_id, deliverable_id, package_line_id, reserved_quantity, status, reservation_ledger_entry_id, release_ledger_entry_id, created_at, released_at",
          )
          .eq("tenant_id", tenantId)
          .eq("client_id", clientId)
          .in("deliverable_id", deliverableIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (lineResponse.error || ledgerResponse.error || allocationResponse.error) {
    return { ok: false };
  }

  const lineRows = (lineResponse.data ?? []) as PackageLineRow[];
  const ledgerRows = (ledgerResponse.data ?? []) as PackageLedgerRow[];
  const allocationRows = (allocationResponse.data ?? []) as DeliverableAllocationRow[];
  const contracts = ((contractResponse.data ?? []) as ContractWriteRow[]).map(
    toContractSafeSummaryFromWriteRow,
  );
  const packages = packageRows.map((packageRow) =>
    toPackageSafeSummaryFromRows({
      packageRow,
      lineRows: lineRows.filter((line) => line.package_id === packageRow.id),
      ledgerRows: ledgerRows.filter((entry) => entry.package_id === packageRow.id),
    }),
  );
  const deliverables = deliverableRows.map((deliverableRow) =>
    toDeliverableSafeSummaryFromRows({
      deliverableRow,
      allocationRows: allocationRows.filter(
        (allocation) => allocation.deliverable_id === deliverableRow.id,
      ),
    }),
  );

  if (audience === "client") {
    return {
      ok: true,
      value: {
        audience: "client",
        contracts: contracts.map((contract) => ({
          name: contract.name,
          reference: contract.reference,
          summary: contract.summary,
          periodStart: contract.periodStart,
          periodEnd: contract.periodEnd,
          status: contract.status,
        })),
        packages: packages.map((packageSummary) => ({
          name: packageSummary.name,
          periodStart: packageSummary.periodStart,
          periodEnd: packageSummary.periodEnd,
          status: packageSummary.status,
          lines: packageSummary.lines.map((line) => ({
            serviceLabel: line.serviceLabel,
            unitLabel: line.unitLabel,
            balance: line.balance,
          })),
        })),
        deliverables: deliverables.map(toClientDeliverableSummary),
      },
    };
  }

  return {
    ok: true,
    value: {
      audience: "management",
      clientId,
      contracts,
      packages,
      deliverables: deliverables.map(toManagementDeliverableSummary),
    },
  };
};
