import {
  guardClientDetailRoute,
  guardManagementRoute,
  resolveRouteActor,
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
  const actor = resolveRouteActor(query?.as);
  const detailAccess = guardClientDetailRoute({ actor, clientId });
  const writeAccess = guardManagementRoute({ actor, route: "clientWrite" });

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
