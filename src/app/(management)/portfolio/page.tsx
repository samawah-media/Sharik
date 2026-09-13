import { AssignedClients } from "@/ui/management/assigned-clients";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  canUseRouteActorFixtures,
  guardPortfolioRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { PageHeader } from "@/ui/layout/page-header";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import { ManagementExceptionDashboard } from "@/ui/management/exception-dashboard";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(params?.as);

  if (!runtime.ok) {
    if (
      runtime.reason === "auth_required" ||
      runtime.reason === "session_expired"
    ) {
      return <SessionExpiredState />;
    }

    if (runtime.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref="/sign-in" />;
    }

    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const { actor } = runtime;
  const access = guardPortfolioRoute({ actor, clients: runtime.clients });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    if (access.reason === "no_assigned_clients") {
      return <NoAssignedClientState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const clients = runtime.clients.filter(
    (client) => client.tenantId === actor.tenantId,
  );
  const navigation = resolveRoleAwareNavigation({
    actor,
    assignedClients: clients,
  });
  // `runtime.clients` is already tenant- and assignment-scoped. Navigation is
  // presentation-only and must not be reused as the data visibility source.
  const visibleClients = clients;
  const isManagementPortfolio = navigation.items.some(
    (navigationItem) => navigationItem.id === "management.clients",
  );
  const results = await Promise.allSettled(
    visibleClients.map((client) =>
      listScopedDeliverables({
        tenantId: client.tenantId,
        clientId: client.id,
      }),
    ),
  );
  const unavailable = results.some(
    (result) => result.status === "rejected" || !result.value.ok,
  );
  const scopedDeliverables = results.flatMap((result) =>
    result.status === "fulfilled" && result.value.ok
      ? result.value.deliverables
      : [],
  );

  return (
    <main className="grid gap-6">
      {canUseRouteActorFixtures() ? (
        <RoleAwareNavigation
          items={navigation.items}
          label="تنقل مساحة الفريق"
        />
      ) : null}
      <PageHeader
        description={
          isManagementPortfolio
            ? "الأعمال التي تحتاج تدخلك الآن، ثم مساحات العملاء المصرح بها."
            : "أعمال العملاء المسندة لك وما يحتاج متابعة الآن."
        }
        title={isManagementPortfolio ? "لوحة الإدارة" : "مساحة العمل"}
      />
      {unavailable ? (
        <section role="alert" className="rounded-lg border border-border bg-surface p-5">
          <h2 className="font-semibold">ما قدرنا نحمّل ملخص الأعمال.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            الأرقام غير متاحة الآن. تقدر تفتح مساحة العميل أو تعيد تحميل الصفحة.
          </p>
        </section>
      ) : (
        <ManagementExceptionDashboard
          clientNames={Object.fromEntries(
            visibleClients.map((client) => [client.id, client.name]),
          )}
          deliverables={scopedDeliverables}
          now={new Date().toISOString()}
        />
      )}
      <h2 className="text-xl font-semibold">عملائي</h2>
      <AssignedClients clients={visibleClients} />
    </main>
  );
}
