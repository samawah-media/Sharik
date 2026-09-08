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
import { buttonStyles } from "@/ui/core/button";
import {
  CardDescription,
  CardHeader,
  CardLink,
  CardTitle,
} from "@/ui/core/card";
import {
  buildEmptyMvpStats,
  buildManagementMvpStats,
  buildMvpStatsFromDeliverables,
  HadnaMvpHero,
} from "@/ui/mvp/hadna-mvp-summary";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
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
    permission: PERMISSIONS.DELIVERABLE_VIEW,
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
  const supabase = canUseRouteActorFixtures()
    ? undefined
    : await createSupabaseServerClient();
  const [summary, scopedDeliverables] = await Promise.all([
    canViewCommercial && canUseRouteActorFixtures()
      ? Promise.resolve({
          ok: true as const,
          value: fixtureManagementCommercialSummary,
        })
      : canViewCommercial && supabase
        ? readCommercialSummary({
            supabase,
            tenantId: client.tenantId,
            clientId: client.id,
            audience: "management",
          })
        : Promise.resolve({ ok: false as const }),
    canViewDeliverables
      ? listScopedDeliverables({
          tenantId: client.tenantId,
          clientId: client.id,
          supabase,
        })
      : Promise.resolve({ ok: false as const }),
  ]);
  const stats =
    summary.ok && summary.value.audience === "management"
      ? buildManagementMvpStats(summary.value)
      : scopedDeliverables.ok
        ? buildMvpStatsFromDeliverables(scopedDeliverables.deliverables)
        : buildEmptyMvpStats();
  return (
    <main className="grid gap-5">
      <HadnaMvpHero
        clientName={client.name}
        roleLabel="مساحة سماوة"
        showPackageLineCount={canViewCommercial}
        stats={stats}
      />
      <section
        aria-label="مسارات تجربة العميل"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        {canViewContracts ? (
          <CardLink href={`/clients/${client.id}/contracts`}>
            <CardHeader>
              <CardTitle>العقد والباقة</CardTitle>
              <CardDescription>
                الاتفاق والمتبقي من الباقة بشكل مبسط.
              </CardDescription>
            </CardHeader>
            <span
              className={buttonStyles({
                className: "mt-4",
                variant: "secondary",
              })}
            >
              العقد والباقة
            </span>
          </CardLink>
        ) : null}
        {canViewDeliverables ? (
          <CardLink href={`/clients/${client.id}/deliverables`}>
            <CardHeader>
              <CardTitle>المخرجات</CardTitle>
              <CardDescription>
                قائمة المخرجات المتفق عليها وحالة كل مخرج.
              </CardDescription>
            </CardHeader>
            <span
              className={buttonStyles({
                className: "mt-4",
                variant: "secondary",
              })}
            >
              المخرجات
            </span>
          </CardLink>
        ) : null}
        {canUpdateDeliverableStatus ? (
          <CardLink href={`/clients/${client.id}/deliverables/board`}>
            <CardHeader>
              <CardTitle>لوحة العمل</CardTitle>
              <CardDescription>متابعة العمل الداخلي للعميل.</CardDescription>
            </CardHeader>
            <span
              className={buttonStyles({
                className: "mt-4",
                variant: "primary",
              })}
            >
              لوحة العمل
            </span>
          </CardLink>
        ) : null}
        {canViewCommercial ? (
          <CardLink href={`/clients/${client.id}/commercial`}>
            <CardHeader>
              <CardTitle>المتابعة / SLA</CardTitle>
              <CardDescription>
                ملخص الرصيد والاستهلاك وحالة الباقة.
              </CardDescription>
            </CardHeader>
            <span
              className={buttonStyles({
                className: "mt-4",
                variant: "secondary",
              })}
            >
              المتابعة / SLA
            </span>
          </CardLink>
        ) : null}
      </section>
    </main>
  );
}
