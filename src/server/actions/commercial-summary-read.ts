import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientCommercialSummary,
  CommercialSummary,
  ManagementCommercialSummary,
} from "@/modules/commercial/commercial-summary";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableLifecycleStatus } from "@/modules/deliverables/deliverable-rules";
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

const progressByStatus: Record<DeliverableLifecycleStatus, number> = {
  not_started: 0,
  in_progress: 30,
  ready_for_internal_review: 50,
  internal_changes_requested: 45,
  internally_approved: 70,
  waiting_client_approval: 80,
  client_changes_requested: 65,
  client_approved: 90,
  ready_for_delivery: 95,
  delivered: 100,
  cancelled: 0,
  archived: 100,
};

const fixturePackageLines = [
  {
    id: "package_line_posts_a",
    serviceLabel: "منشورات",
    deliverableTypeHint: "post",
    unitLabel: "منشور",
    committedQuantity: 20,
    reserved: 14,
    available: 6,
  },
  {
    id: "package_line_reels_a",
    serviceLabel: "ريلز",
    deliverableTypeHint: "reel",
    unitLabel: "فيديو",
    committedQuantity: 10,
    reserved: 7,
    available: 3,
  },
  {
    id: "package_line_stories_a",
    serviceLabel: "ستوري",
    deliverableTypeHint: "story",
    unitLabel: "ستوري",
    committedQuantity: 8,
    reserved: 5,
    available: 3,
  },
  {
    id: "package_line_designs_a",
    serviceLabel: "تصاميم",
    deliverableTypeHint: "design",
    unitLabel: "تصميم",
    committedQuantity: 8,
    reserved: 4,
    available: 4,
  },
  {
    id: "package_line_reports_a",
    serviceLabel: "تقارير",
    deliverableTypeHint: "report",
    unitLabel: "تقرير",
    committedQuantity: 6,
    reserved: 3,
    available: 3,
  },
] as const;

const fixtureStatusPlan: DeliverableLifecycleStatus[] = [
  ...Array<DeliverableLifecycleStatus>(12).fill("delivered"),
  ...Array<DeliverableLifecycleStatus>(8).fill("in_progress"),
  ...Array<DeliverableLifecycleStatus>(7).fill("ready_for_internal_review"),
  ...Array<DeliverableLifecycleStatus>(6).fill("internally_approved"),
  ...Array<DeliverableLifecycleStatus>(5).fill("waiting_client_approval"),
  ...Array<DeliverableLifecycleStatus>(4).fill("client_changes_requested"),
  ...Array<DeliverableLifecycleStatus>(10).fill("not_started"),
];

const fixtureDeliverables: DeliverableSafeSummary[] = fixtureStatusPlan.map(
  (status, index) => {
    const line = fixturePackageLines[index % fixturePackageLines.length];
    const number = index + 1;
    const dateDay = String((index % 28) + 1).padStart(2, "0");

    return {
      id: `hadna_deliverable_${number}`,
      tenantId: "tenant_a",
      clientId: "client_a",
      contractId: "contract_a",
      packageId: "package_a",
      packageLineId: line.id,
      name: `${line.serviceLabel} هدنة ${number}`,
      type: line.deliverableTypeHint,
      status,
      priority: index % 9 === 0 ? "high" : "normal",
      ownerUserId: "assigned_internal_a",
      contributorUserIds: [],
      startDate: `2026-07-${dateDay}`,
      internalDueDate: `2026-07-${dateDay}`,
      clientDueDate: `2026-08-${dateDay}`,
      finalDueDate: `2026-08-${dateDay}`,
      requiresInternalApproval: true,
      requiresClientApproval: true,
      progressPercentage: progressByStatus[status],
      currentVersionId: [
        "waiting_client_approval",
        "client_approved",
        "ready_for_delivery",
        "delivered",
      ].includes(status)
        ? `hadna_version_${number}`
        : undefined,
      approvedExtra: false,
      revision: 1,
      createdAt: `2026-07-${dateDay}T00:00:00.000Z`,
      updatedAt: `2026-07-${dateDay}T00:00:00.000Z`,
      reservation: {
        packageLineId: line.id,
        reservedQuantity: 1,
      },
    };
  },
);

const clientVisibleStatuses = new Set<DeliverableLifecycleStatus>([
  "waiting_client_approval",
  "client_approved",
  "ready_for_delivery",
  "delivered",
]);

const isClientVisibleDeliverable = (deliverable: DeliverableSafeSummary) =>
  clientVisibleStatuses.has(deliverable.status) && Boolean(deliverable.currentVersionId);

export const fixtureManagementCommercialSummary: ManagementCommercialSummary = {
  audience: "management",
  clientId: "client_a",
  contracts: [
    {
      id: "contract_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      name: "عقد هدنة للتشغيل التسويقي",
      summary: "متابعة داخلية آمنة لتجربة هدنة.",
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
      name: "باقة هدنة",
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      lines: fixturePackageLines.map((line) => ({
        id: line.id,
        tenantId: "tenant_a",
        clientId: "client_a",
        packageId: "package_a",
        serviceLabel: line.serviceLabel,
        deliverableTypeHint: line.deliverableTypeHint,
        unitLabel: line.unitLabel,
        committedQuantity: line.committedQuantity,
        status: "active" as const,
        createdAt: "2026-06-28T00:00:00.000Z",
        updatedAt: "2026-06-28T00:00:00.000Z",
        balance: {
          committed: line.committedQuantity,
          reserved: line.reserved,
          consumed: 0,
          released: 0,
          adjustments: 0,
          available: line.available,
        },
      })),
      balances: fixturePackageLines.map((line) => ({
        packageLineId: line.id,
        committed: line.committedQuantity,
        reserved: line.reserved,
        consumed: 0,
        released: 0,
        adjustments: 0,
        available: line.available,
      })),
    },
  ],
  deliverables: fixtureDeliverables,
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
    lines: (packageSummary.lines ?? []).map((line) => ({
      serviceLabel: line.serviceLabel,
      unitLabel: line.unitLabel,
      balance: line.balance,
    })),
  })),
  deliverables: fixtureManagementCommercialSummary.deliverables
    .filter(isClientVisibleDeliverable)
    .map(toClientDeliverableSummary),
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
          "id, tenant_id, client_id, contract_id, package_id, package_line_id, current_version_id, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, idempotency_key, created_by, created_at, updated_at, cancelled_at, revision",
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
  const deliverableRows = ((deliverableResponse.data ?? []) as DeliverableWriteRow[]).filter(
    (row) => audience === "management" || (
      clientVisibleStatuses.has(row.status as DeliverableLifecycleStatus) &&
      Boolean(row.current_version_id)
    ),
  );
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
          lines: (packageSummary.lines ?? []).map((line) => ({
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
