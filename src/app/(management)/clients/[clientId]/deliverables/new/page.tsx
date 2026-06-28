import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { projectPackageBalance } from "@/modules/packages/package-ledger";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createApprovedExtraDeliverableAction,
  createDeliverableAction,
} from "@/server/actions/deliverables";
import type {
  PackageLedgerRow,
  PackageLineRow,
  PackageWriteRow,
} from "@/server/actions/package-write-rpc";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  DeliverableDeniedState,
  DeliverableForm,
} from "@/ui/management/deliverable-form";
import {
  AccessDeniedState,
  MembershipDisabledState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

const listFirstActivePackageLines = async ({
  tenantId,
  clientId,
}: {
  tenantId: string;
  clientId: string;
}): Promise<
  | {
      ok: true;
      contractId: string;
      packageId: string;
      packageLines: PackageLineSafeSummary[];
    }
  | { ok: false }
> => {
  if (canUseRouteActorFixtures()) {
    return { ok: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: packageRows, error: packageError } = await supabase
    .from("packages")
    .select(
      "id, tenant_id, client_id, contract_id, name, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (packageError || !packageRows?.[0]) {
    return { ok: false };
  }

  const packageRow = packageRows[0] as PackageWriteRow;
  const [lineResponse, ledgerResponse] = await Promise.all([
    supabase
      .from("package_lines")
      .select(
        "id, tenant_id, client_id, package_id, service_label, deliverable_type_hint, unit_label, committed_quantity, status, created_by, created_at, updated_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("package_id", packageRow.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("package_ledger_entries")
      .select(
        "id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key, occurred_at",
      )
      .eq("tenant_id", tenantId)
      .eq("client_id", clientId)
      .eq("package_id", packageRow.id),
  ]);

  if (lineResponse.error || ledgerResponse.error || !lineResponse.data) {
    return { ok: false };
  }

  const ledgerRows = (ledgerResponse.data ?? []) as PackageLedgerRow[];
  const packageLines = (lineResponse.data as PackageLineRow[]).map((line) => ({
    id: line.id,
    tenantId: line.tenant_id,
    clientId: line.client_id,
    packageId: line.package_id,
    serviceLabel: line.service_label,
    deliverableTypeHint: line.deliverable_type_hint ?? undefined,
    unitLabel: line.unit_label,
    committedQuantity: toNumber(line.committed_quantity),
    status: line.status as PackageLineSafeSummary["status"],
    createdAt: line.created_at,
    updatedAt: line.updated_at,
    balance: projectPackageBalance(
      ledgerRows
        .filter((entry) => entry.package_line_id === line.id)
        .map((entry) => ({
          id: entry.id,
          tenantId: entry.tenant_id,
          clientId: entry.client_id,
          packageLineId: entry.package_line_id,
          entryType: entry.entry_type,
          quantity: toNumber(entry.quantity),
          deliverableId: entry.deliverable_id ?? undefined,
          reason: entry.reason ?? undefined,
          occurredAt: entry.occurred_at,
        })) as Parameters<typeof projectPackageBalance>[0],
    ),
  }));

  if (packageLines.length === 0) {
    return { ok: false };
  }

  return {
    ok: true,
    contractId: packageRow.contract_id,
    packageId: packageRow.id,
    packageLines,
  };
};

export default async function NewClientDeliverablePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string; mode?: string }>;
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

  const packageContext = approvedExtra
    ? undefined
    : await listFirstActivePackageLines({
        tenantId: client.tenantId,
        clientId: client.id,
      });

  if (!approvedExtra && (!packageContext || !packageContext.ok)) {
    return <DeliverableDeniedState />;
  }

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
        packageId={packageContext?.ok ? packageContext.packageId : undefined}
        packageLines={packageContext?.ok ? packageContext.packageLines : []}
        idempotencyKey={crypto.randomUUID()}
      />
    </main>
  );
}
