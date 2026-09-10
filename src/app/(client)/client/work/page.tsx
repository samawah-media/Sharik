import { resolveRouteRuntime, guardClientDetailRoute, canUseRouteActorFixtures } from "@/server/navigation/route-guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readCommercialSummary, fixtureClientCommercialSummary } from "@/server/actions/commercial-summary-read";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { ClientWorkBoard, ClientWorkEmptyState } from "@/ui/client/client-work-board";
import { ErrorState } from "@/ui/core/states";
import type { ClientCommercialSummary } from "@/modules/commercial/commercial-summary";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

import { readClientWorkspace } from "@/server/navigation/client-workspace";

export const dynamic = "force-dynamic";

const emptyClientCommercialSummary: ClientCommercialSummary = {
  audience: "client",
  contracts: [],
  packages: [],
  deliverables: [],
};

export default async function ClientWorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(
    params?.as ?? (canUseRouteActorFixtures() ? "client_approver_a" : undefined),
  );

  if (!runtime.ok) {
    if (
      runtime.reason === "auth_required" ||
      runtime.reason === "session_expired"
    )
      return <SessionExpiredState />;
    if (runtime.reason === "membership_disabled")
      return <MembershipDisabledState returnHref="/sign-in" />;
    return <AccessDeniedState returnHref="/sign-in" />;
  }

  const { actor } = runtime;
  const { clients, selectedClient: primaryClient } = await readClientWorkspace(runtime);
  if (!primaryClient) return <NoAssignedClientState returnHref="/sign-in" />;
  if (
    !guardClientDetailRoute({ actor, clientId: primaryClient.id, clients })
      .allowed
  )
    return <AccessDeniedState />;

  const canApprove = evaluatePermission({
    actor,
    permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
    resource: { tenantId: primaryClient.tenantId, clientId: primaryClient.id },
  }).allowed;

  const summary = canUseRouteActorFixtures()
    ? primaryClient.id === "client_a"
      ? { ok: true as const, value: fixtureClientCommercialSummary }
      : { ok: true as const, value: emptyClientCommercialSummary }
    : await readCommercialSummary({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
        audience: "client",
      });

  const renderBody = () => {
    if (!summary.ok) {
      return (
        <ErrorState
          description="تعذر تحميل أعمالك الآن. حاول مرة أخرى."
          returnHref="/client"
          title="تعذر تحميل الأعمال"
        />
      );
    }
    if (summary.value.audience !== "client" || summary.value.deliverables.length === 0) {
      return <ClientWorkEmptyState />;
    }
    return <ClientWorkBoard canApprove={canApprove} deliverables={summary.value.deliverables} />;
  };

  return (
    <main
      className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:py-8"
      dir="rtl"
    >
      <header className="grid gap-2">
        <p className="text-sm font-semibold text-accent">مساحة العميل</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">أعمالي</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          هنا تجد كل أعمالك: ما ينتظر قرارك، وما طلبنا تعديله لدى فريق سماوة،
          وما تم اعتماده وتسليمه. افتح أي عمل لمتابعة تفاصيله.
        </p>
      </header>
      {renderBody()}
    </main>
  );
}
