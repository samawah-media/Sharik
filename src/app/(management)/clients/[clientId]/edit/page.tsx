import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ClientForm } from "@/ui/management/client-form";
import {
  AccessDeniedState,
  ResourceNotFoundState,
} from "@/ui/shared/access-states";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const runtime = await resolveRouteRuntime(query?.as);

  if (!runtime.ok || !canUseRouteActorFixtures()) {
    return <AccessDeniedState />;
  }

  const detailAccess = guardClientDetailRoute({
    actor: runtime.actor,
    clientId,
    clients: runtime.clients,
  });
  const writeAccess = guardManagementRoute({
    actor: runtime.actor,
    route: "clientWrite",
  });

  if (!detailAccess.allowed && detailAccess.reason === "not_found") {
    return <ResourceNotFoundState />;
  }

  if (!detailAccess.allowed || !writeAccess.allowed) {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">تعديل العميل</h1>
      <ClientForm
        mode="update"
        client={{
          id: clientId,
          tenantId: "tenant-placeholder",
          name: "",
          slug: "",
          status: "active",
          createdBy: "system",
          createdAt: "",
          updatedAt: "",
          revision: 1,
        }}
      />
    </main>
  );
}
