import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import { readPersistentClientApprovalInbox } from "@/server/actions/persistent-client-approval";
import { decidePersistentClientVersion } from "@/server/actions/persistent-client-approval";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import { ClientPendingInbox } from "@/ui/client/client-pending-inbox";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

async function submitPendingDecision(formData: FormData) {
  "use server";
  if (canUseRouteActorFixtures()) return;
  const action = String(formData.get("clientApprovalAction") ?? "");
  if (action !== "approve" && action !== "request_changes") return;
  const result = await decidePersistentClientVersion({
    supabase: await createSupabaseServerClient(),
    input: {
      clientId: String(formData.get("clientId") ?? ""),
      deliverableId: String(formData.get("deliverableId") ?? ""),
      versionId: String(formData.get("versionId") ?? ""),
      decision: action === "approve" ? "approved" : "changes_requested",
      comment: String(formData.get("reason") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    },
  });
  if (result.ok) {
    revalidatePath("/client");
    revalidatePath("/client/pending");
  }
}

const fixturePendingDetail: ClientSafeDeliverableDetail = {
  approvalItem: {
    clientId: "client_a",
    deliverableId: "r007_visible_deliverable",
    versionId: "r007_visible_version",
    expectedRevision: 3,
    isActionable: true,
    displayName: "مخرج تجريبي آمن",
    typeLabel: "منشور",
    statusLabel: "بانتظار موافقتك",
    versionLabel: "النسخة المعتمدة للعميل",
    dueDateLabel: "2026-07-12",
  },
  statusLabel: "بانتظار موافقتك",
  progressPercentage: 80,
  files: [],
  comments: [],
};

export default async function ClientPendingPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(
    params?.as ?? (canUseRouteActorFixtures() ? "client_viewer_a" : undefined),
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

  const { actor, clients } = runtime;
  const primaryClient = clients.find((client) =>
    actor.roleAssignments.some(
      (assignment) =>
        assignment.status === "active" &&
        assignment.scopeType === "client" &&
        assignment.scopeId === client.id,
    ),
  );
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

  const details = canUseRouteActorFixtures()
    ? primaryClient.id === "client_a"
      ? [fixturePendingDetail]
      : []
    : await readPersistentClientApprovalInbox({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
        clientName: primaryClient.name,
      });

  return (
    <ClientPendingInbox
      approveAction={canApprove ? submitPendingDecision : undefined}
      canApprove={canApprove}
      details={details}
      requestChangesAction={canApprove ? submitPendingDecision : undefined}
    />
  );
}
