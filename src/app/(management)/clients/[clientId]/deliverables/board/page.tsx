import Link from "next/link";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import { updateDeliverableStatusAction } from "@/server/actions/deliverable-status";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  DeliverableBoard,
  DeliverableBoardEmptyState,
} from "@/ui/management/deliverable-board";
import { DeliverableDeniedState } from "@/ui/management/deliverable-form";
import {
  AccessDeniedState,
  MembershipDisabledState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

export default async function ClientDeliverablesBoardPage({
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

  const canUpdateDeliverableStatus = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canUpdateDeliverableStatus) {
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
          <h1 className="text-2xl font-semibold">لوحة Kanban الداخلية</h1>
          <p className="mt-2 text-sm text-muted">{client.name}</p>
          {query?.saved === "status-updated" ? (
            <p className="mt-2 text-sm text-success">تم تحديث حالة المخرج.</p>
          ) : null}
          {query?.saved === "denied" ? (
            <p className="mt-2 text-sm text-danger">
              تعذر تنفيذ تغيير الحالة بأمان.
            </p>
          ) : null}
        </div>
        <Link
          className="w-fit rounded-md border border-border px-4 py-2 text-sm font-semibold"
          href={`/clients/${client.id}/deliverables`}
        >
          قائمة المخرجات
        </Link>
      </div>
      {deliverableList.deliverables.length > 0 ? (
        <DeliverableBoard
          action={updateDeliverableStatusAction}
          deliverables={deliverableList.deliverables}
        />
      ) : (
        <DeliverableBoardEmptyState />
      )}
    </main>
  );
}
