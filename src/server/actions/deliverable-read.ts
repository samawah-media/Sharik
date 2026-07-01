import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import {
  toDeliverableSafeSummaryFromRows,
  type DeliverableAllocationRow,
  type DeliverableWriteRow,
} from "./deliverable-write-rpc";

export const fixtureManagementDeliverables: DeliverableSafeSummary[] = [
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
    ownerUserId: "assigned_internal_a",
    contributorUserIds: [],
    startDate: "2026-07-01",
    internalDueDate: "2026-07-03",
    clientDueDate: "2026-07-05",
    finalDueDate: "2026-07-07",
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
  {
    id: "deliverable_internal_ready_a",
    tenantId: "tenant_a",
    clientId: "client_a",
    name: "تصميم إعلان المنتج",
    type: "design",
    status: "internally_approved",
    priority: "high",
    ownerUserId: "assigned_internal_a",
    contributorUserIds: ["designer_a"],
    internalDueDate: "2026-07-02",
    clientDueDate: "2026-07-04",
    finalDueDate: "2026-07-06",
    requiresInternalApproval: true,
    requiresClientApproval: true,
    progressPercentage: 70,
    approvedExtra: true,
    revision: 2,
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
  },
];

const selectDeliverableRows = async (
  supabase: SupabaseClient,
  tenantId: string,
  clientId: string,
) =>
  supabase
    .from("deliverables")
    .select(
      "id, tenant_id, client_id, contract_id, package_id, package_line_id, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, idempotency_key, created_by, created_at, updated_at, cancelled_at, revision",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

export const listScopedDeliverables = async ({
  tenantId,
  clientId,
  supabase,
}: {
  tenantId: string;
  clientId: string;
  supabase?: SupabaseClient;
}) => {
  if (canUseRouteActorFixtures()) {
    return {
      ok: true as const,
      deliverables:
        tenantId === "tenant_a" && clientId === "client_a"
          ? fixtureManagementDeliverables
          : [],
    };
  }

  const client = supabase ?? (await createSupabaseServerClient());
  const { data: deliverableRows, error: deliverableError } =
    await selectDeliverableRows(client, tenantId, clientId);

  if (deliverableError || !deliverableRows) {
    return { ok: false as const };
  }

  const deliverableIds = deliverableRows.map((row) => row.id);

  if (deliverableIds.length === 0) {
    return { ok: true as const, deliverables: [] };
  }

  const { data: allocationRows, error: allocationError } = await client
    .from("deliverable_allocations")
    .select(
      "id, tenant_id, client_id, deliverable_id, package_line_id, reserved_quantity, status, reservation_ledger_entry_id, release_ledger_entry_id, created_at, released_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .in("deliverable_id", deliverableIds);

  if (allocationError) {
    return { ok: false as const };
  }

  const allocations = (allocationRows ?? []) as DeliverableAllocationRow[];

  return {
    ok: true as const,
    deliverables: (deliverableRows as DeliverableWriteRow[]).map(
      (deliverableRow) =>
        toDeliverableSafeSummaryFromRows({
          deliverableRow,
          allocationRows: allocations.filter(
            (allocation) => allocation.deliverable_id === deliverableRow.id,
          ),
        }),
    ),
  };
};
