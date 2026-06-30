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
  const writeAccess = guardManagementRoute({ actor, route: "clientWrite" });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const visibleClients = clients.filter((client) => client.tenantId === actor.tenantId);
  const showFixtureEmptyState = canUseRouteActorFixtures();

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">العملاء</h1>
      {visibleClients.length > 0 && !showFixtureEmptyState ? (
        <section aria-label="قائمة العملاء" className="grid gap-3">
          {visibleClients.map((client) => (
            <article className="rounded-lg border border-border p-4" key={client.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{client.name}</h2>
                  <p className="mt-1 font-mono text-xs text-muted">{client.slug}</p>
                </div>
                <Link
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                  href={`/clients/${client.id}`}
                >
                  فتح مساحة العميل
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                  href={`/clients/${client.id}/contracts`}
                >
                  العقود
                </Link>
                <Link
                  className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                  href={`/clients/${client.id}/deliverables`}
                >
                  المخرجات
                </Link>
                <Link
                  className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                  href={`/clients/${client.id}/commercial`}
                >
                  الملخص التجاري
                </Link>
                {writeAccess.allowed ? (
                  <Link
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                    href={`/clients/${client.id}/edit`}
                  >
                    تعديل
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <ClientEmptyState />
      )}
      {writeAccess.allowed ? (
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
