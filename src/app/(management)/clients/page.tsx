import Link from "next/link";
import {
  canUseRouteActorFixtures,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ClientEmptyState } from "@/ui/management/client-form";
import {
  AccessDeniedState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ClientsPage({
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

  const { actor, clients } = runtime;
  const access = guardManagementRoute({ actor, route: "clients" });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const visibleClients = clients.filter((client) => client.tenantId === actor.tenantId);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">العملاء</h1>
      {visibleClients.length > 0 && !canUseRouteActorFixtures() ? (
        <section aria-label="قائمة العملاء" className="grid gap-3">
          {visibleClients.map((client) => (
            <article className="rounded-lg border border-border p-4" key={client.id}>
              <h2 className="text-base font-semibold">{client.name}</h2>
              <p className="mt-1 font-mono text-xs text-muted">{client.slug}</p>
            </article>
          ))}
        </section>
      ) : (
        <ClientEmptyState />
      )}
      {canUseRouteActorFixtures() ? (
        <Link
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/clients/new"
        >
          إضافة عميل
        </Link>
      ) : null}
    </main>
  );
}
