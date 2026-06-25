import {
  canUseRouteActorFixtures,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ClientForm } from "@/ui/management/client-form";
import { AccessDeniedState } from "@/ui/shared/access-states";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok || !canUseRouteActorFixtures()) {
    return <AccessDeniedState />;
  }

  const access = guardManagementRoute({ actor: runtime.actor, route: "clientWrite" });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">إضافة عميل</h1>
      <ClientForm />
    </main>
  );
}
