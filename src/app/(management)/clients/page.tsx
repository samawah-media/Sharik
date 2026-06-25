import Link from "next/link";
import {
  guardManagementRoute,
  resolveRouteActor,
} from "@/server/navigation/route-guards";
import { ClientEmptyState } from "@/ui/management/client-form";
import { AccessDeniedState } from "@/ui/shared/access-states";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const actor = resolveRouteActor(params?.as);
  const access = guardManagementRoute({ actor, route: "clients" });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">العملاء</h1>
      <ClientEmptyState />
      <Link
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        href="/clients/new"
      >
        إضافة عميل
      </Link>
    </main>
  );
}
