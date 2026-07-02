import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fixtureManagementCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ManagementCommercialSummaryCards } from "@/ui/management/commercial-summary";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ManagementCommercialSummaryPage({
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

  const canViewSummary =
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.CONTRACT_VIEW,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed &&
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed;

  if (!canViewSummary) {
    return <AccessDeniedState />;
  }

  const summary = canUseRouteActorFixtures()
    ? { ok: true as const, value: fixtureManagementCommercialSummary }
    : await readCommercialSummary({
        supabase: await createSupabaseServerClient(),
        tenantId: client.tenantId,
        clientId: client.id,
        audience: "management",
      });

  if (!summary.ok || summary.value.audience !== "management") {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid gap-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الملخص التجاري</h1>
        <p className="mt-2 text-sm text-muted">{client.name}</p>
      </div>
      <ManagementCommercialSummaryCards summary={summary.value} />
    </main>
  );
}
