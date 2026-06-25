import { ClientHome } from "@/ui/client/client-home";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  guardClientDetailRoute,
  resolveRouteActor,
  routeClients,
} from "@/server/navigation/route-guards";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import { AccessDeniedState } from "@/ui/shared/access-states";

export default async function ClientPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const actor = resolveRouteActor(params?.as ?? "client_viewer_a");
  const access = guardClientDetailRoute({ actor, clientId: "client_a" });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const navigation = resolveRoleAwareNavigation({
    actor,
    assignedClients: routeClients.filter((client) => client.id === "client_a"),
  });

  return (
    <>
      <RoleAwareNavigation items={navigation.items} label="تنقل بوابة العميل" />
      <ClientHome />
    </>
  );
}
