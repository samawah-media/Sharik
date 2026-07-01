import Link from "next/link";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { cancelNotStartedDeliverableAction } from "@/server/actions/deliverable-cancellations";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
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
          {query?.saved === "cancelled" ? (
            <p className="mt-2 text-sm text-success">
              تم إلغاء المخرج وإرجاع السعة المحجوزة.
            </p>
          ) : null}
          {query?.saved === "denied" ? (
            <p className="mt-2 text-sm text-danger">
              تعذر تنفيذ الطلب بأمان.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdateDeliverableStatus ? (
            <Link
              className="w-fit rounded-md border border-border px-4 py-2 text-sm font-semibold"
              href={`/clients/${client.id}/deliverables/board`}
            >
              لوحة Kanban
            </Link>
          ) : null}
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
        <DeliverableList
          cancellationAction={cancelNotStartedDeliverableAction}
          deliverables={deliverableList.deliverables}
        />
      ) : (
        <DeliverableEmptyState />
      )}
    </main>
  );
}
