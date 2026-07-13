import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fixtureManagementCommercialSummary } from "@/server/actions/commercial-summary-read";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import {
  createMemberDirectory,
  resolveMemberDisplays,
} from "@/modules/members/member-directory";
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
      "id, tenant_id, client_id, contract_id, package_id, package_line_id, current_version_id, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, idempotency_key, created_by, created_at, updated_at, cancelled_at, revision",
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
    const fixtureDirectory = createMemberDirectory([
      { user_id: "assigned_internal_a", display_name: "أحمد العتيبي", role_label: "مدير مشروع" },
      { user_id: "assigned_writer_a", display_name: "سارة القحطاني", role_label: "كاتبة محتوى" },
      { user_id: "assigned_designer_a", display_name: "رائد الحربي", role_label: "مصمم" },
      { user_id: "designer_a", display_name: "رائد الحربي", role_label: "مصمم" },
    ]);
    return {
      ok: true as const,
      deliverables:
        tenantId === "tenant_a" && clientId === "client_a"
          ? fixtureManagementDeliverables.map((deliverable) => ({
              ...deliverable,
              ownerDisplay: fixtureDirectory[deliverable.ownerUserId ?? ""],
              contributorDisplays: resolveMemberDisplays(
                fixtureDirectory,
                deliverable.contributorUserIds,
              ),
            }))
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

  const memberIds = Array.from(
    new Set(
      deliverableRows
        .flatMap((row) => [
          row.owner_user_id,
          ...(row.contributor_user_ids ?? []),
        ])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: memberRows, error: memberError } = memberIds.length
    ? await client
        .from("member_profiles")
        .select("user_id, display_name, role_label, avatar_url")
        .eq("tenant_id", tenantId)
        .in("user_id", memberIds)
    : { data: [], error: null };

  if (memberError) {
    return { ok: false as const };
  }

  const memberDirectory = createMemberDirectory(memberRows ?? []);

  return {
    ok: true as const,
    deliverables: (deliverableRows as DeliverableWriteRow[]).map(
      (deliverableRow) => ({
          ...toDeliverableSafeSummaryFromRows({
            deliverableRow,
            allocationRows: allocations.filter(
              (allocation) => allocation.deliverable_id === deliverableRow.id,
            ),
          }),
          ownerDisplay: memberDirectory[deliverableRow.owner_user_id ?? ""],
          contributorDisplays: resolveMemberDisplays(
            memberDirectory,
            deliverableRow.contributor_user_ids ?? [],
          ),
        }),
    ),
  };
};
