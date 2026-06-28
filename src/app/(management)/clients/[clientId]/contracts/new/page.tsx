import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createContractAction } from "@/server/actions/contracts";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  ContractDeniedState,
  ContractForm,
} from "@/ui/management/contract-form";
import {
  AccessDeniedState,
  MembershipDisabledState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function NewClientContractPage({
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

  const canCreateContracts = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canCreateContracts) {
    return <ContractDeniedState />;
  }

  return (
    <main className="grid max-w-3xl gap-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إنشاء عقد جديد</h1>
        <p className="mt-2 text-sm text-muted">{client.name}</p>
      </div>
      <ContractForm
        action={createContractAction}
        clientId={client.id}
        idempotencyKey={crypto.randomUUID()}
      />
    </main>
  );
}
