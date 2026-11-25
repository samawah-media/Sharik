import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectPackageBalance } from "@/modules/packages/package-ledger";
import type { PackageLineSafeSummary } from "@/modules/packages/package-repository";
import { canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import type {
  PackageLedgerRow,
  PackageLineRow,
  PackageWriteRow,
} from "./package-write-rpc";

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

export const loadActivePackageRows = ({
  supabase,
  tenantId,
  clientId,
  requestedPackageId,
}: {
  supabase: SupabaseClient;
  tenantId: string;
  clientId: string;
  requestedPackageId?: string;
}) => {
  let query = supabase
    .from("packages")
    .select(
      "id, tenant_id, client_id, contract_id, name, period_start, period_end, status, idempotency_key, created_by, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("status", "active");
  if (requestedPackageId) query = query.eq("id", requestedPackageId);
  return query.order("created_at", { ascending: false }).limit(1);
};

export const listFirstActivePackageLines = async ({
  tenantId,
  clientId,
  requestedPackageId,
}: {
  tenantId: string;
  clientId: string;
  requestedPackageId?: string;
}): Promise<
  | {
      ok: true;
      contractId: string;
      packageId: string;
      packageLines: PackageLineSafeSummary[];
    }
  | { ok: false; reason: "missing" | "unavailable" }
> => {
  if (canUseRouteActorFixtures()) {
    return { ok: false, reason: "unavailable" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: packageRows, error: packageError } =
    await loadActivePackageRows({
      supabase,
      tenantId,
      clientId,
      requestedPackageId,
    });

  if (!packageError && !packageRows?.[0])
    return { ok: false, reason: "missing" };

  if (packageError || !packageRows?.[0]) {
    return { ok: false, reason: "unavailable" };
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
    return { ok: false, reason: "unavailable" };
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
    return { ok: false, reason: "missing" };
  }

  return {
    ok: true,
    contractId: packageRow.contract_id,
    packageId: packageRow.id,
    packageLines,
  };
};
