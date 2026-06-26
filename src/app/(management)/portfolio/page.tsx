import { AssignedClients } from "@/ui/management/assigned-clients";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  guardPortfolioRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
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

  return (
    <main className="grid gap-6">
      <RoleAwareNavigation items={navigation.items} label="تنقل مساحة الفريق" />
      <h1 className="text-2xl font-semibold">عملائي</h1>
      <AssignedClients clients={visibleClients} />
    </main>
  );
}
