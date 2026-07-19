import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fixtureManagementCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { cancelNotStartedDeliverableAction } from "@/server/actions/deliverable-cancellations";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import { listScopedDeliverableWorkspaceSummaries } from "@/server/actions/deliverable-workspace-read";
import {
  DeliverableDeniedState,
  DeliverableEmptyState,
  DeliverableList,
} from "@/ui/management/deliverable-form";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { PageHeader } from "@/ui/layout/page-header";
import {
  buildManagementMvpStats,
  buildMvpStatsFromDeliverables,
  formatMvpClientName,
  MvpSnapshotCards,
} from "@/ui/mvp/hadna-mvp-summary";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

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
    if (
      runtime.reason === "auth_required" ||
      runtime.reason === "session_expired"
    ) {
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
    return <ClientUnavailableState />;
  }

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <ClientUnavailableState />;
  }

  const client = runtime.clients.find((item) => item.id === clientId);

  if (!client) {
    return <ClientUnavailableState />;
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
  const canUpdateDeliverableStatus = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
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

  const summary =
    canUseRouteActorFixtures()
      ? { ok: true as const, value: fixtureManagementCommercialSummary }
      : await readCommercialSummary({
          supabase: await createSupabaseServerClient(),
          tenantId: client.tenantId,
          clientId: client.id,
          audience: "management",
        });
  const stats =
    summary.ok && summary.value.audience === "management"
      ? buildManagementMvpStats(summary.value)
      : buildMvpStatsFromDeliverables(deliverableList.deliverables);
  const displayClientName = formatMvpClientName(client.name);
  const workspaces = await listScopedDeliverableWorkspaceSummaries({
    tenantId: client.tenantId,
    clientId: client.id,
    deliverables: deliverableList.deliverables.map((deliverable) => ({
      id: deliverable.id,
      currentVersionId: deliverable.currentVersionId,
    })),
  });

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        actions={
          <>
            {canUpdateDeliverableStatus ? (
              <ButtonLink
                href={`/clients/${client.id}/deliverables/board`}
                variant="secondary"
              >
                لوحة العمل
              </ButtonLink>
            ) : null}
            {canCreateDeliverables ? (
              <ButtonLink
                href={`/clients/${client.id}/deliverables/new`}
                variant="primary"
              >
                مخرج جديد
              </ButtonLink>
            ) : null}
            {canCreateExtras ? (
              <ButtonLink
                href={`/clients/${client.id}/deliverables/new?mode=extra`}
                variant="secondary"
              >
                مخرج إضافي معتمد
              </ButtonLink>
            ) : null}
          </>
        }
        description={displayClientName}
        status={
          <div className="flex flex-wrap gap-2">
            {query?.saved === "created" ? (
              <Badge tone="success">تم حفظ المخرج وحجز الكمية.</Badge>
            ) : null}
            {query?.saved === "extra-created" ? (
              <Badge tone="success">تم حفظ المخرج الإضافي.</Badge>
            ) : null}
            {query?.saved === "cancelled" ? (
              <Badge tone="success">تم إلغاء المخرج وإرجاع السعة.</Badge>
            ) : null}
            {query?.saved === "denied" ? (
              <Badge tone="danger">تعذر تنفيذ الطلب بأمان.</Badge>
            ) : null}
          </div>
        }
        title={`مخرجات ${displayClientName}`}
      />
      <MvpSnapshotCards stats={stats} />
      {deliverableList.deliverables.length > 0 ? (
        <DeliverableList
          cancellationAction={cancelNotStartedDeliverableAction}
          clientName={displayClientName}
          deliverables={deliverableList.deliverables}
          workspaces={workspaces}
        />
      ) : (
        <DeliverableEmptyState />
      )}
    </main>
  );
}
