import { listFirstActivePackageLines } from "@/server/actions/deliverable-package-read";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  createApprovedExtraDeliverableAction,
  createDeliverableAction,
} from "@/server/actions/deliverables";
import { listEligibleDeliverableMembers } from "@/server/actions/deliverable-member-read";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  DeliverableDeniedState,
  DeliverableForm,
} from "@/ui/management/deliverable-form";
import { resolveCountUnitPreselection } from "@/modules/deliverables/count-unit-guidance";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function NewClientDeliverablePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{
    as?: string;
    mode?: string;
    packageId?: string;
    packageLine?: string;
  }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const runtime = await resolveRouteRuntime(query?.as);
  const approvedExtra = query?.mode === "extra";

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

  const requiredPermission = approvedExtra
    ? PERMISSIONS.DELIVERABLE_EXTRA_CREATE
    : PERMISSIONS.DELIVERABLE_CREATE;
  const canCreate = evaluatePermission({
    actor: runtime.actor,
    permission: requiredPermission,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canCreate) {
    return <DeliverableDeniedState />;
  }

  const [packageContext, eligibleMembers] = await Promise.all([
    approvedExtra
      ? Promise.resolve(undefined)
      : listFirstActivePackageLines({
          tenantId: client.tenantId,
          clientId: client.id,
          requestedPackageId: query?.packageId,
        }),
    listEligibleDeliverableMembers({
      tenantId: client.tenantId,
      clientId: client.id,
    }),
  ]);

  if (!approvedExtra && (!packageContext || !packageContext.ok)) {
    return <DeliverableDeniedState />;
  }

  const preselection =
    packageContext?.ok
      ? resolveCountUnitPreselection({
          clientId: client.id,
          packageId: packageContext.packageId,
          packageLines: packageContext.packageLines,
          requestedPackageLineId: query?.packageLine,
        })
      : undefined;

  return (
    <main className="grid max-w-4xl gap-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">
          {approvedExtra ? "إنشاء مخرج إضافي معتمد" : "إنشاء مخرج جديد"}
        </h1>
        <p className="mt-2 text-sm text-muted">{client.name}</p>
      </div>
      <DeliverableForm
        action={
          approvedExtra
            ? createApprovedExtraDeliverableAction
            : createDeliverableAction
        }
        approvedExtra={approvedExtra}
        clientId={client.id}
        contractId={packageContext?.ok ? packageContext.contractId : undefined}
        eligibleMembers={eligibleMembers.members}
        memberDirectoryAvailable={eligibleMembers.ok}
        packageId={packageContext?.ok ? packageContext.packageId : undefined}
        packageLines={packageContext?.ok ? packageContext.packageLines : []}
        initialPackageLineId={preselection?.packageLineId}
        suggestedName={preselection?.suggestedName}
        idempotencyKey={crypto.randomUUID()}
      />
    </main>
  );
}
