import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  toPackageSafeSummaryFromRows,
  type PackageLedgerRow,
  type PackageLineRow,
  type PackageWriteRow,
} from "@/server/actions/package-write-rpc";
import {
  PackageDeniedState,
  PackageEmptyState,
  PackageList,
} from "@/ui/management/package-form";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { PageHeader } from "@/ui/layout/page-header";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const listScopedPackages = async ({
  tenantId,
  clientId,
  contractId,
}: {
  tenantId: string;
  clientId: string;
  contractId: string;
}) => {
  if (canUseRouteActorFixtures()) {
    return { ok: true as const, packages: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data: packageRows, error: packageError } = await supabase
    .from("packages")
    .select(
      "id, tenant_id, client_id, contract_id, name, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (packageError || !packageRows) {
    return { ok: false as const };
  }

  const packageIds = packageRows.map((row) => row.id);

  if (packageIds.length === 0) {
    return { ok: true as const, packages: [] };
  }

  const [lineResponse, ledgerResponse] = await Promise.all([
    supabase
      .from("package_lines")
      .select(
        "id, tenant_id, client_id, package_id, service_label, deliverable_type_hint, unit_label, committed_quantity, status, created_by, created_at, updated_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("package_id", packageIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("package_ledger_entries")
      .select(
        "id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key, occurred_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .in("package_id", packageIds)
      .order("occurred_at", { ascending: true }),
  ]);

  if (lineResponse.error || ledgerResponse.error) {
    return { ok: false as const };
  }

  const lineRows = (lineResponse.data ?? []) as PackageLineRow[];
  const ledgerRows = (ledgerResponse.data ?? []) as PackageLedgerRow[];

  return {
    ok: true as const,
    packages: (packageRows as PackageWriteRow[]).map((packageRow) =>
      toPackageSafeSummaryFromRows({
        packageRow,
        lineRows: lineRows.filter((line) => line.package_id === packageRow.id),
        ledgerRows: ledgerRows.filter(
          (entry) => entry.package_id === packageRow.id,
        ),
      }),
    ),
  };
};

export default async function ContractPackagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; contractId: string }>;
  searchParams?: Promise<{ as?: string; saved?: string }>;
}) {
  const [{ clientId, contractId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
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

  const canViewPackages = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;
  const canCreatePackages = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.PACKAGE_CREATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  if (!canViewPackages) {
    return <PackageDeniedState />;
  }

  const packageList = await listScopedPackages({
    tenantId: client.tenantId,
    clientId: client.id,
    contractId,
  });

  if (!packageList.ok) {
    return <PackageDeniedState />;
  }

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        actions={
          canCreatePackages ? (
            <ButtonLink
              href={`/clients/${client.id}/contracts/${contractId}/packages/new`}
              variant="primary"
            >
              باقة جديدة
            </ButtonLink>
          ) : null
        }
        description={client.name}
        status={
          query?.saved === "created" ? (
            <Badge tone="success">تم حفظ الباقة بأمان.</Badge>
          ) : null
        }
        title={`باقات ${client.name}`}
      />
      {packageList.packages.length > 0 ? (
        <PackageList packages={packageList.packages} />
      ) : (
        <PackageEmptyState />
      )}
    </main>
  );
}
