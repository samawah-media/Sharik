import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  guardClientsIndexRoute,
  guardManagementRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { ClientEmptyState } from "@/ui/management/client-form";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/core/card";
import { PageHeader } from "@/ui/layout/page-header";
import { formatMvpClientName } from "@/ui/mvp/hadna-mvp-summary";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
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

  const { actor, clients } = runtime;
  const access = guardClientsIndexRoute({ actor, clients });
  const writeAccess = guardManagementRoute({ actor, route: "clientWrite" });

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    if (access.reason === "no_assigned_clients") {
      return <NoAssignedClientState returnHref={access.safeReturnHref} />;
    }

    return <AccessDeniedState returnHref={access.safeReturnHref} />;
  }

  const visibleClients = clients.filter(
    (client) =>
      evaluatePermission({
        actor,
        permission: PERMISSIONS.CLIENT_VIEW,
        resource: { tenantId: client.tenantId, clientId: client.id },
      }).allowed,
  );
  return (
    <main className="grid gap-6">
      <PageHeader
        actions={
          writeAccess.allowed ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/clients/onboard" variant="primary">
                إضافة أول عميل
              </ButtonLink>
              <ButtonLink href="/clients/new" variant="secondary">
                إضافة عميل
              </ButtonLink>
            </div>
          ) : null
        }
        description="العملاء المسندون لك مع روابط التشغيل الأساسية."
        title="العملاء"
      />
      {visibleClients.length > 0 ? (
        <section
          aria-label="قائمة العملاء"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleClients.map((client) => (
            <Card className="grid content-between gap-4" key={client.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardHeader>
                  <CardTitle>{formatMvpClientName(client.name)}</CardTitle>
                  <CardDescription>مساحة تشغيل نشطة</CardDescription>
                </CardHeader>
                <Badge tone="success">نشط</Badge>
              </div>
              <div className="grid gap-3">
                <ButtonLink href={`/clients/${client.id}`} variant="primary">
                  فتح المساحة
                </ButtonLink>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    href={`/clients/${client.id}/deliverables`}
                    size="sm"
                    variant="secondary"
                  >
                    المخرجات
                  </ButtonLink>
                  <ButtonLink
                    href={`/clients/${client.id}/contracts`}
                    size="sm"
                    variant="secondary"
                  >
                    العقد والباقة
                  </ButtonLink>
                  <ButtonLink
                    href={`/clients/${client.id}/commercial`}
                    size="sm"
                    variant="secondary"
                  >
                    المتابعة / SLA
                  </ButtonLink>
                  {writeAccess.allowed ? (
                    <ButtonLink
                      href={`/clients/${client.id}/edit`}
                      size="sm"
                      variant="ghost"
                    >
                      تعديل
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <ClientEmptyState />
      )}
    </main>
  );
}
