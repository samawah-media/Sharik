import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { toContractSafeSummaryFromWriteRow } from "@/server/actions/contract-write-rpc";
import {
  ContractDeniedState,
  ContractEmptyState,
  ContractList,
} from "@/ui/management/contract-form";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { PageHeader } from "@/ui/layout/page-header";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const listScopedContracts = async ({
  tenantId,
  clientId,
}: {
  tenantId: string;
  clientId: string;
}) => {
  if (canUseRouteActorFixtures()) {
    return { ok: true as const, contracts: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      "id, tenant_id, client_id, name, reference, summary, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at, archived_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    contracts: data.map(toContractSafeSummaryFromWriteRow),
  };
};

export default async function ClientContractsPage({
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

  const canViewContracts = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;
  const canCreateContracts = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canViewContracts) {
    return <ContractDeniedState />;
  }

  const contractList = await listScopedContracts({
    tenantId: client.tenantId,
    clientId: client.id,
  });

  if (!contractList.ok) {
    return <ContractDeniedState />;
  }

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        actions={
          canCreateContracts ? (
            <ButtonLink
              href={`/clients/${client.id}/contracts/new`}
              variant="primary"
            >
              عقد جديد
            </ButtonLink>
          ) : null
        }
        description={client.name}
        status={
          query?.saved === "created" ? (
            <Badge tone="success">تم حفظ العقد بأمان.</Badge>
          ) : null
        }
        title={`عقود ${client.name}`}
      />
      {contractList.contracts.length > 0 ? (
        <ContractList contracts={contractList.contracts} />
      ) : (
        <ContractEmptyState />
      )}
    </main>
  );
}
