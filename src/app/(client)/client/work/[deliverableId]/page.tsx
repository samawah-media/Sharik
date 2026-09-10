import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientWorkspaces } from "@/server/auth/client-workspace";
import { readClientForDeliverable } from "@/server/navigation/client-workspace";
import { revalidatePath } from "next/cache";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  decidePersistentClientVersion,
  readPersistentClientWorkDetail,
} from "@/server/actions/persistent-client-approval";
import {
  fixtureClientCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import { clientStatusLabel } from "@/modules/deliverables/client-labels";
import {
  ClientDeliverableDetail,
  type ClientSafeDeliverableDetail,
} from "@/ui/client/client-deliverable-detail";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";
import { ButtonLink } from "@/ui/core/button";

export const dynamic = "force-dynamic";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidPersistentDeliverableId(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

function buildFixtureWorkDetail(
  deliverableId: string,
  clientId: string,
): ClientSafeDeliverableDetail | undefined {
  if (clientId !== "client_a") return undefined;
  const summary = fixtureClientCommercialSummary;
  const match = summary.deliverables.find(
    (deliverable) => deliverable.id === deliverableId,
  );
  if (!match) return undefined;
  const waiting = match.status === "waiting_client_approval";
  return {
    approvalItem: {
      clientId,
      deliverableId: match.id,
      versionId: `${match.id}_version`,
      expectedRevision: 1,
      isActionable: waiting,
      displayName: match.name,
      typeLabel: match.type,
      status: match.status,
      statusLabel: clientStatusLabel(match.status),
      versionLabel: "النسخة الحالية",
      dueDateLabel: match.clientDueDate,
    },
    status: match.status,
    statusLabel: clientStatusLabel(match.status),
    progressPercentage: match.progressPercentage,
    files: [],
    comments: [],
  };
}

async function submitWorkDetailDecision(formData: FormData) {
  "use server";
  if (canUseRouteActorFixtures()) return;
  const action = String(formData.get("clientApprovalAction") ?? "");
  if (action !== "approve" && action !== "request_changes") return;
  const deliverableId = String(formData.get("deliverableId") ?? "");
  const result = await decidePersistentClientVersion({
    supabase: await createSupabaseServerClient(),
    input: {
      clientId: String(formData.get("clientId") ?? ""),
      deliverableId,
      versionId: String(formData.get("versionId") ?? ""),
      decision: action === "approve" ? "approved" : "changes_requested",
      comment: String(formData.get("reason") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    },
  });
  if (result.ok) {
    revalidatePath("/client");
    revalidatePath("/client/pending");
    revalidatePath("/client/work");
    revalidatePath(`/client/work/${deliverableId}`);
  }
}

export default async function ClientWorkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ deliverableId: string }>;
  searchParams?: Promise<{ as?: string }>;
}) {
  const { deliverableId } = await params;
  const safeDeliverableId = decodeURIComponent(deliverableId);
  const query = await searchParams;
  const usingFixtures = canUseRouteActorFixtures();
  const runtime = await resolveRouteRuntime(
    query?.as ?? (usingFixtures ? "client_approver_a" : undefined),
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
  const clients = getClientWorkspaces(runtime);
  if (clients.length === 0) return <NoAssignedClientState returnHref="/sign-in" />;
  const supabase = !usingFixtures && isValidPersistentDeliverableId(safeDeliverableId)
    ? await createSupabaseServerClient()
    : undefined;
  const primaryClient = usingFixtures
    ? clients.find((client) => buildFixtureWorkDetail(safeDeliverableId, client.id))
    : supabase
      ? await readClientForDeliverable({ runtime, supabase, deliverableId: safeDeliverableId })
      : undefined;
  if (!primaryClient) return <ResourceNotFoundState returnHref="/client/work" />;
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

  let detail: ClientSafeDeliverableDetail | undefined;
  if (usingFixtures) {
    detail = buildFixtureWorkDetail(safeDeliverableId, primaryClient.id);
  } else if (supabase) {
    detail = await readPersistentClientWorkDetail({
      supabase,
      tenantId: primaryClient.tenantId,
      clientId: primaryClient.id,
      deliverableId: safeDeliverableId,
      clientName: primaryClient.name,
    });
  } else {
    detail = undefined;
  }

  if (!detail) {
    return (
      <main
        className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-8"
        dir="rtl"
      >
        <ResourceNotFoundState returnHref="/client/work" />
      </main>
    );
  }

  return (
    <main
      className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-6 sm:py-8"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-accent">أعمالي</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {detail.approvalItem.displayName}
          </h1>
        </div>
        <ButtonLink href="/client/work" variant="secondary">
          العودة إلى أعمالي
        </ButtonLink>
      </div>
      <ClientDeliverableDetail
        approveAction={canApprove ? submitWorkDetailDecision : undefined}
        canApprove={canApprove}
        detail={detail}
        requestChangesAction={canApprove ? submitWorkDetailDecision : undefined}
      />
    </main>
  );
}
