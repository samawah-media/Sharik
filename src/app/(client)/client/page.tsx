import { ClientHome } from "@/ui/client/client-home";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
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
import {
  buildClientMvpStats,
  buildEmptyMvpStats,
} from "@/ui/mvp/hadna-mvp-summary";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ClientPage({
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

  const navigation = resolveRoleAwareNavigation({
    actor,
    assignedClients: clients.filter((client) => client.id === primaryClient.id),
  });
  const summary = canUseRouteActorFixtures()
    ? { ok: true as const, value: fixtureClientCommercialSummary }
    : await readCommercialSummary({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
        audience: "client",
      });
  const stats =
    summary.ok && summary.value.audience === "client"
      ? buildClientMvpStats(summary.value)
      : buildEmptyMvpStats();

  return (
    <>
      <RoleAwareNavigation items={navigation.items} label="تنقل بوابة العميل" />
      <ClientHome clientName={primaryClient.name} stats={stats} />
    </>
  );
}
