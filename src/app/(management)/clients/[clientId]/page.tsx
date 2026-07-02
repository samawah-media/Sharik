import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/core/card";
import { PageHeader } from "@/ui/layout/page-header";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const runtime = await resolveRouteRuntime(query?.as);

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

  const access = guardClientDetailRoute({
    actor: runtime.actor,
    clientId,
    clients: runtime.clients,
  });

  if (!access.allowed && access.reason === "not_found") {
    return <ClientUnavailableState />;
  }

  if (!access.allowed) {
    if (access.reason === "membership_disabled") {
      return <MembershipDisabledState returnHref={access.safeReturnHref} />;
    }

    return <ClientUnavailableState />;
  }

  const client = runtime.clients.find((item) => item.id === clientId);

  if (!client) {
    return <ClientUnavailableState />;
  }

  const permissionResource = { tenantId: client.tenantId, clientId: client.id };
  const canViewContracts = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: permissionResource,
  }).allowed;
  const canViewDeliverables = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: permissionResource,
  }).allowed;
  const canUpdateDeliverableStatus = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    resource: permissionResource,
  }).allowed;
  const canViewCommercial =
    canViewContracts &&
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
      resource: permissionResource,
    }).allowed;

  return (
    <main className="grid gap-5">
      <PageHeader
        description={client.name}
        status={<Badge tone="success">عميل نشط داخل النطاق</Badge>}
        title="مساحة تشغيل العميل"
      />
      <section
        aria-label="مسارات تجربة العميل"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {canViewContracts ? (
          <Card>
            <CardHeader>
              <CardTitle>العقود والباقات</CardTitle>
              <CardDescription>
                إدارة الاتفاق والمتبقي بدون فوترة متقدمة.
              </CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/contracts`}
              variant="secondary"
            >
              فتح العقود
            </ButtonLink>
          </Card>
        ) : null}
        {canViewDeliverables ? (
          <Card>
            <CardHeader>
              <CardTitle>المخرجات</CardTitle>
              <CardDescription>
                قائمة المخرجات المتفق عليها وحالة كل مخرج.
              </CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/deliverables`}
              variant="secondary"
            >
              فتح المخرجات
            </ButtonLink>
          </Card>
        ) : null}
        {canUpdateDeliverableStatus ? (
          <Card>
            <CardHeader>
              <CardTitle>لوحة Kanban الداخلية</CardTitle>
              <CardDescription>عرض تشغيلي للفريق والإدارة فقط.</CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/deliverables/board`}
              variant="primary"
            >
              فتح اللوحة
            </ButtonLink>
          </Card>
        ) : null}
        {canViewCommercial ? (
          <Card>
            <CardHeader>
              <CardTitle>الملخص التجاري</CardTitle>
              <CardDescription>
                متابعة الرصيد والاستهلاك الحالي.
              </CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/commercial`}
              variant="secondary"
            >
              فتح الملخص
            </ButtonLink>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
