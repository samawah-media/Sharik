import {
  guardClientDetailRoute,
  resolveRouteActor,
} from "@/server/navigation/route-guards";
import {
  AccessDeniedState,
  ResourceNotFoundState,
} from "@/ui/shared/access-states";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const actor = resolveRouteActor(query?.as);
  const access = guardClientDetailRoute({ actor, clientId });

  if (!access.allowed && access.reason === "not_found") {
    return <ResourceNotFoundState />;
  }

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-semibold">مساحة العميل</h1>
      <p className="text-sm text-muted">
        تظهر هذه الصفحة فقط عند اجتياز تحقق الصلاحية من جهة السيرفر.
      </p>
    </main>
  );
}
