import { AssignedClients } from "@/ui/management/assigned-clients";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fixtureManagementCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  canUseRouteActorFixtures,
  guardPortfolioRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ButtonLink } from "@/ui/core/button";
import {
  buildEmptyMvpStats,
  buildManagementMvpStats,
  HadnaMvpHero,
} from "@/ui/mvp/hadna-mvp-summary";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok) {
    if (runtime.reason === "auth_required" || runtime.reason === "session_expired") {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const { actor } = runtime;
  const access = guardPortfolioRoute({ actor, clients: runtime.clients });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    if (access.reason === "no_assigned_clients") {
      return <NoAssignedClientState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const clients = runtime.clients.filter((client) => client.tenantId === actor.tenantId);
  const navigation = resolveRoleAwareNavigation({
    actor,
    assignedClients: clients,
  });
  const visibleClients = clients.filter((client) =>
    navigation.items.some((item) => item.id === "management.clients")
      ? true
      : navigation.items.some((item) => item.id === `client.${client.id}`),
  );
  const primaryClient = visibleClients[0];
  const summary =
    primaryClient && canUseRouteActorFixtures()
      ? { ok: true as const, value: fixtureManagementCommercialSummary }
      : primaryClient
        ? await readCommercialSummary({
            supabase: await createSupabaseServerClient(),
            tenantId: primaryClient.tenantId,
            clientId: primaryClient.id,
            audience: "management",
          })
        : { ok: false as const };
  const stats =
    summary.ok && summary.value.audience === "management"
      ? buildManagementMvpStats(summary.value)
      : buildEmptyMvpStats();
  const roleLabel = navigation.items.some(
    (item) => item.id === "management.clients",
  )
    ? "الإدارة / مدير المشروع"
    : "مدير الحساب";

  return (
    <main className="grid gap-6">
      <RoleAwareNavigation items={navigation.items} label="تنقل مساحة الفريق" />
      {primaryClient ? (
        <HadnaMvpHero
          clientName={primaryClient.name}
          roleLabel={roleLabel}
          stats={stats}
        >
          <ButtonLink href={`/clients/${primaryClient.id}`} variant="primary">
            عرض هدنة
          </ButtonLink>
          <ButtonLink
            href={`/clients/${primaryClient.id}/deliverables`}
            variant="secondary"
          >
            عرض المخرجات
          </ButtonLink>
          <ButtonLink
            href={`/clients/${primaryClient.id}/commercial`}
            variant="secondary"
          >
            فتح المتابعة / SLA
          </ButtonLink>
        </HadnaMvpHero>
      ) : null}
      <h2 className="text-xl font-semibold">عملائي</h2>
      <AssignedClients clients={visibleClients} />
    </main>
  );
}
