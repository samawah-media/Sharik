import { AssignedClients } from "@/ui/management/assigned-clients";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  guardPortfolioRoute,
  resolveRouteActor,
  routeClients,
} from "@/server/navigation/route-guards";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import { NoAssignedClientState } from "@/ui/shared/access-states";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const actor = resolveRouteActor(params?.as);
  const access = guardPortfolioRoute({ actor });

  if (!access.allowed) {
    return <NoAssignedClientState />;
  }

  const clients = routeClients.filter((client) => client.tenantId === actor.tenantId);
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
