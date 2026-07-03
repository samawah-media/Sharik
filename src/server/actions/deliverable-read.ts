import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fixtureManagementCommercialSummary } from "@/server/actions/commercial-summary-read";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import {
  toDeliverableSafeSummaryFromRows,
  type DeliverableAllocationRow,
  type DeliverableWriteRow,
} from "./deliverable-write-rpc";

export const fixtureManagementDeliverables =
  fixtureManagementCommercialSummary.deliverables;

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
