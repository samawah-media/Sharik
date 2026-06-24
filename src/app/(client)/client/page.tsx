import { ClientHome } from "@/ui/client/client-home";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import { resolveRouteActor, routeClients } from "@/server/navigation/route-guards";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";

export default async function ClientPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const actor = resolveRouteActor(params?.as ?? "client_viewer_a");
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
