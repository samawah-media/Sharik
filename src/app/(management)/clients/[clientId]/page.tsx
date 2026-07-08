import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fixtureManagementCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/core/card";
import { PageHeader } from "@/ui/layout/page-header";
import {
  buildEmptyMvpStats,
  buildManagementMvpStats,
  formatMvpClientName,
  HadnaMvpHero,
} from "@/ui/mvp/hadna-mvp-summary";
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
  const summary =
    canViewCommercial && canUseRouteActorFixtures()
      ? { ok: true as const, value: fixtureManagementCommercialSummary }
      : canViewCommercial
        ? await readCommercialSummary({
            supabase: await createSupabaseServerClient(),
            tenantId: client.tenantId,
            clientId: client.id,
            audience: "management",
          })
        : { ok: false as const };
  const stats =
    summary.ok && summary.value.audience === "management"
      ? buildManagementMvpStats(summary.value)
      : buildEmptyMvpStats();
  const displayClientName = formatMvpClientName(client.name);

  return (
    <main className="grid gap-5">
      <PageHeader
        description="مسارات التشغيل الأساسية للعميل المسند لك."
        status={<Badge tone="success">نشط</Badge>}
        title={displayClientName}
      />
      <HadnaMvpHero clientName={client.name} roleLabel="مساحة سماوة" stats={stats}>
        {canViewDeliverables ? (
          <ButtonLink href={`/clients/${client.id}/deliverables`} variant="primary">
            عرض المخرجات
          </ButtonLink>
        ) : null}
        {canViewContracts ? (
          <ButtonLink href={`/clients/${client.id}/contracts`} variant="secondary">
            عرض الباقة
          </ButtonLink>
        ) : null}
        {canUpdateDeliverableStatus ? (
          <ButtonLink
            href={`/clients/${client.id}/deliverables/board`}
            variant="secondary"
          >
            فتح لوحة العمل
          </ButtonLink>
        ) : null}
      </HadnaMvpHero>
      <section
        aria-label="مسارات تجربة العميل"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {canViewContracts ? (
          <Card>
            <CardHeader>
              <CardTitle>العقد والباقة</CardTitle>
              <CardDescription>
                الاتفاق والمتبقي من الباقة بشكل مبسط.
              </CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/contracts`}
              variant="secondary"
            >
              العقد والباقة
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
              المخرجات
            </ButtonLink>
          </Card>
        ) : null}
        {canUpdateDeliverableStatus ? (
          <Card>
            <CardHeader>
              <CardTitle>لوحة العمل</CardTitle>
              <CardDescription>متابعة العمل الداخلي للعميل.</CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/deliverables/board`}
              variant="primary"
            >
              لوحة العمل
            </ButtonLink>
          </Card>
        ) : null}
        {canViewCommercial ? (
          <Card>
            <CardHeader>
              <CardTitle>المتابعة / SLA</CardTitle>
              <CardDescription>
                ملخص الرصيد والاستهلاك وحالة الباقة.
              </CardDescription>
            </CardHeader>
            <ButtonLink
              className="mt-4"
              href={`/clients/${client.id}/commercial`}
              variant="secondary"
            >
              المتابعة / SLA
            </ButtonLink>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
