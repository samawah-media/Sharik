import Link from "next/link";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  toDeliverableSafeSummaryFromRows,
  type DeliverableAllocationRow,
  type DeliverableWriteRow,
} from "@/server/actions/deliverable-write-rpc";
import {
  DeliverableDeniedState,
  DeliverableEmptyState,
  DeliverableList,
} from "@/ui/management/deliverable-form";
import {
  AccessDeniedState,
  MembershipDisabledState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const listScopedDeliverables = async ({
  tenantId,
  clientId,
}: {
  tenantId: string;
  clientId: string;
}) => {
  if (canUseRouteActorFixtures()) {
    return { ok: true as const, deliverables: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data: deliverableRows, error: deliverableError } = await supabase
    .from("deliverables")
    .select(
      "id, tenant_id, client_id, contract_id, package_id, package_line_id, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, idempotency_key, created_by, created_at, updated_at, cancelled_at, revision",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (deliverableError || !deliverableRows) {
    return { ok: false as const };
  }

  const deliverableIds = deliverableRows.map((row) => row.id);

  if (deliverableIds.length === 0) {
    return { ok: true as const, deliverables: [] };
  }

  const { data: allocationRows, error: allocationError } = await supabase
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

export default async function ClientDeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string; saved?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const runtime = await resolveRouteRuntime(query?.as);

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const access = guardClientDetailRoute({
    actor: runtime.actor,
    clientId,
    clients: runtime.clients,
  });

  if (!access.allowed && access.reason === "not_found") {
    return <ResourceNotFoundState />;
  }

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const client = runtime.clients.find((item) => item.id === clientId);

  if (!client) {
    return <ResourceNotFoundState />;
  }

  const canViewDeliverables = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;
  const canCreateDeliverables = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;
  const canCreateExtras = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_EXTRA_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canViewDeliverables) {
    return <DeliverableDeniedState />;
  }

  const deliverableList = await listScopedDeliverables({
    tenantId: client.tenantId,
    clientId: client.id,
  });

  if (!deliverableList.ok) {
    return <DeliverableDeniedState />;
  }

  return (
    <main className="grid gap-5" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">مخرجات {client.name}</h1>
          {query?.saved === "created" ? (
            <p className="mt-2 text-sm text-success">تم حفظ المخرج وحجز الكمية.</p>
          ) : null}
          {query?.saved === "extra-created" ? (
            <p className="mt-2 text-sm text-success">تم حفظ المخرج الإضافي.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateDeliverables ? (
            <Link
              className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              href={`/clients/${client.id}/deliverables/new`}
            >
              مخرج جديد
            </Link>
          ) : null}
          {canCreateExtras ? (
            <Link
              className="w-fit rounded-md border border-border px-4 py-2 text-sm font-semibold"
              href={`/clients/${client.id}/deliverables/new?mode=extra`}
            >
              مخرج إضافي معتمد
            </Link>
          ) : null}
        </div>
      </div>
      {deliverableList.deliverables.length > 0 ? (
        <DeliverableList deliverables={deliverableList.deliverables} />
      ) : (
        <DeliverableEmptyState />
      )}
    </main>
  );
}
