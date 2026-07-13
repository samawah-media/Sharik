import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fixtureClientCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ClientCommercialSummaryCards } from "@/ui/client/commercial-summary";
import { ButtonLink } from "@/ui/core/button";
import {
  buildClientMvpStats,
  HadnaMvpHero,
} from "@/ui/mvp/hadna-mvp-summary";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ClientCommercialSummaryPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(
    params?.as ?? (canUseRouteActorFixtures() ? "client_viewer_a" : undefined),
  );

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const { actor, clients } = runtime;
  const primaryClient = clients.find((client) =>
    actor.roleAssignments.some(
      (assignment) =>
        assignment.status === "active" &&
        assignment.scopeType === "client" &&
        assignment.scopeId === client.id,
    ),
  );

  if (!primaryClient) {
    return <NoAssignedClientState returnHref="/sign-in" />;
  }

  const access = guardClientDetailRoute({
    actor,
    clientId: primaryClient.id,
    clients,
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const canViewSummary =
    evaluatePermission({
      actor,
      permission: PERMISSIONS.CONTRACT_VIEW,
      resource: { tenantId: primaryClient.tenantId, clientId: primaryClient.id },
    }).allowed &&
    evaluatePermission({
      actor,
      permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
      resource: { tenantId: primaryClient.tenantId, clientId: primaryClient.id },
    }).allowed;

  if (!canViewSummary) {
    return <AccessDeniedState />;
  }

  const summary = canUseRouteActorFixtures()
    ? { ok: true as const, value: fixtureClientCommercialSummary }
    : await readCommercialSummary({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
        audience: "client",
      });

  if (!summary.ok || summary.value.audience !== "client") {
    return <AccessDeniedState />;
  }

  return (
    <>
      <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-8" dir="rtl">
        <HadnaMvpHero
          clientName={primaryClient.name}
          roleLabel="بوابة العميل"
          stats={buildClientMvpStats(summary.value)}
        >
          <ButtonLink href="#deliverables" variant="primary">
            عرض مخرجاتي
          </ButtonLink>
          <ButtonLink href="#package" variant="secondary">
            الباقة والمتبقي
          </ButtonLink>
        </HadnaMvpHero>
        <ClientCommercialSummaryCards summary={summary.value} />
      </main>
    </>
  );
}
