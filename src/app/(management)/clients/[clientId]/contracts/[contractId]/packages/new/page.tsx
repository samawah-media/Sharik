import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createPackageAction } from "@/server/actions/packages";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  PackageDeniedState,
  PackageForm,
} from "@/ui/management/package-form";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function NewContractPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; contractId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const [{ clientId, contractId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
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

  const canCreatePackages = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.PACKAGE_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canCreatePackages) {
    return <PackageDeniedState />;
  }

  return (
    <main className="grid max-w-3xl gap-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إنشاء باقة جديدة</h1>
        <p className="mt-2 text-sm text-muted">{client.name}</p>
      </div>
      <PackageForm
        action={createPackageAction}
        clientId={client.id}
        contractId={contractId}
        idempotencyKey={crypto.randomUUID()}
      />
    </main>
  );
}
