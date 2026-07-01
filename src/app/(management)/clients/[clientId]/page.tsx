import Link from "next/link";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  AccessDeniedState,
  MembershipDisabledState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string }>;
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

  const permissionResource = { tenantId: client.tenantId, clientId: client.id };
  const canViewContracts = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: permissionResource,
  }).allowed;
  const canViewDeliverables = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: permissionResource,
  }).allowed;
  const canViewCommercial =
    canViewContracts &&
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
      resource: permissionResource,
    }).allowed;

  return (
    <main className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">مساحة تشغيل العميل</h1>
        <p className="mt-2 text-sm text-muted">{client.name}</p>
      </div>
      <section aria-label="مسارات تجربة العميل" className="grid gap-3 sm:grid-cols-3">
        {canViewContracts ? (
          <Link
            className="rounded-lg border border-border p-4 text-sm font-semibold hover:bg-muted"
            href={`/clients/${client.id}/contracts`}
          >
            العقود والباقات
          </Link>
        ) : null}
        {canViewDeliverables ? (
          <Link
            className="rounded-lg border border-border p-4 text-sm font-semibold hover:bg-muted"
            href={`/clients/${client.id}/deliverables`}
          >
            المخرجات
          </Link>
        ) : null}
        {canViewCommercial ? (
          <Link
            className="rounded-lg border border-border p-4 text-sm font-semibold hover:bg-muted"
            href={`/clients/${client.id}/commercial`}
          >
            الملخص التجاري
          </Link>
        ) : null}
      </section>
    </main>
  );
}
