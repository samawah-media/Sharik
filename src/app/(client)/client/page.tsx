import { ClientHome } from "@/ui/client/client-home";
import { ClientDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import {
  InMemoryApprovalRepository,
  type DeliverableVersionRecord,
} from "@/modules/approvals/approval-repository";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  filterClientVisibleComments,
  type CommentRecord,
} from "@/modules/comments/comment-visibility-rules";
import {
  filterClientVisibleFileAssets,
  toClientVisibleFileAssetSummary,
  type FileAssetRecord,
} from "@/modules/files/file-visibility-rules";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { InMemoryDeliverableRepository } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableRecord } from "@/modules/deliverables/deliverable-repository";
import { approveAsClientCommand } from "@/server/commands/approvals/approve-as-client";
import { requestClientChangesCommand } from "@/server/commands/approvals/request-client-changes";
import {
  fixtureClientCommercialSummary,
  readCommercialSummary,
} from "@/server/actions/commercial-summary-read";
import {
  decidePersistentClientVersion,
  readPersistentClientApprovalDetail,
} from "@/server/actions/persistent-client-approval";
import {
  canUseRouteActorFixtures,
  guardClientDetailRoute,
  resolveRouteActor,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  buildClientMvpStats,
  buildEmptyMvpStats,
} from "@/ui/mvp/hadna-mvp-summary";
import { RoleAwareNavigation } from "@/ui/navigation/role-aware-nav";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

const r007ClientPortalDeliverable: DeliverableRecord = {
  id: "r007_visible_deliverable",
  tenantId: "tenant_a",
  clientId: "client_a",
  contractId: "contract_a",
  packageId: "package_a",
  packageLineId: "package_line_posts_a",
  name: "مخرج تجريبي آمن",
  type: "post",
  status: "waiting_client_approval",
  priority: "normal",
  ownerUserId: "assigned_internal_a",
  contributorUserIds: [],
  startDate: "2026-07-08",
  internalDueDate: "2026-07-09",
  clientDueDate: "2026-07-12",
  finalDueDate: "2026-07-14",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 80,
  approvedExtra: false,
  idempotencyKey: "r007-client-portal-visible",
  createdBy: "tenant_admin_a",
  createdAt: "2026-07-08T08:00:00.000Z",
  updatedAt: "2026-07-08T10:00:00.000Z",
  revision: 3,
};

const r007ClientPortalVersion: DeliverableVersionRecord = {
  id: "r007_visible_version",
  tenantId: r007ClientPortalDeliverable.tenantId,
  clientId: r007ClientPortalDeliverable.clientId,
  deliverableId: r007ClientPortalDeliverable.id,
  versionNumber: 2,
  state: "client_visible",
  internalApprovalState: "approved",
  clientApprovalState: "pending",
  submittedBy: "assigned_internal_a",
  submittedAt: "2026-07-08T09:00:00.000Z",
  superseded: false,
};

const r007ClientPortalFiles: FileAssetRecord[] = [
  {
    id: "r007_client_visible_file",
    tenantId: "tenant_a",
    clientId: "client_a",
    ownerUserId: "assigned_internal_a",
    relatedDeliverableId: r007ClientPortalDeliverable.id,
    visibility: "client_visible",
    fileType: "application/pdf",
    fileSize: 1200,
    storagePath: "tenant_a/client_a/r007-visible.pdf",
    versionNumber: 2,
    isFinal: false,
    createdAt: "2026-07-08T09:10:00.000Z",
  },
  {
    id: "r007_final_delivery_file",
    tenantId: "tenant_a",
    clientId: "client_a",
    ownerUserId: "assigned_internal_a",
    relatedDeliverableId: r007ClientPortalDeliverable.id,
    visibility: "final_delivery",
    fileType: "application/pdf",
    fileSize: 1400,
    storagePath: "tenant_a/client_a/r007-final.pdf",
    versionNumber: 2,
    isFinal: true,
    createdAt: "2026-07-08T09:20:00.000Z",
  },
  {
    id: "r007_internal_file",
    tenantId: "tenant_a",
    clientId: "client_a",
    ownerUserId: "assigned_internal_a",
    relatedDeliverableId: r007ClientPortalDeliverable.id,
    visibility: "internal_only",
    fileType: "text/plain",
    fileSize: 300,
    storagePath: "tenant_a/client_a/internal-only.txt",
    versionNumber: 1,
    isFinal: false,
    createdAt: "2026-07-08T09:30:00.000Z",
  },
];

const r007ClientPortalComments: CommentRecord[] = [
  {
    id: "r007_client_comment",
    tenantId: "tenant_a",
    clientId: "client_a",
    relatedEntityType: "deliverable",
    relatedEntityId: r007ClientPortalDeliverable.id,
    commentType: "client_comment",
    visibility: "client_visible",
    body: "تعليق ظاهر للعميل",
    authorUserId: "client_approver_a",
    createdAt: "2026-07-08T10:00:00.000Z",
  },
  {
    id: "r007_internal_comment",
    tenantId: "tenant_a",
    clientId: "client_a",
    relatedEntityType: "deliverable",
    relatedEntityId: r007ClientPortalDeliverable.id,
    commentType: "internal_comment",
    visibility: "internal_only",
    body: "INTERNAL_QA_NOTE_SHOULD_NOT_RENDER",
    authorUserId: "assigned_internal_a",
    createdAt: "2026-07-08T10:05:00.000Z",
  },
];

const fileLabels: Record<string, string> = {
  r007_client_visible_file: "ملف مراجعة العميل",
  r007_final_delivery_file: "ملف التسليم النهائي",
};

const buildR007ClientPortalDetail = ({
  actor,
  clientId,
}: {
  actor: ReturnType<typeof resolveRouteActor>;
  clientId: string;
}): ClientSafeDeliverableDetail | undefined => {
  if (clientId !== r007ClientPortalDeliverable.clientId) {
    return undefined;
  }

  const files = filterClientVisibleFileAssets({
    actor,
    clientId,
    files: r007ClientPortalFiles,
  }).map((file) => ({
    ...toClientVisibleFileAssetSummary(file),
    label: fileLabels[file.id] ?? "ملف متاح للعميل",
  }));
  const comments = filterClientVisibleComments({
    actor,
    clientId,
    comments: r007ClientPortalComments,
  }).map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
  }));

  return {
    approvalItem: {
      clientId,
      deliverableId: r007ClientPortalDeliverable.id,
      versionId: r007ClientPortalVersion.id,
      expectedRevision: r007ClientPortalDeliverable.revision,
      displayName: r007ClientPortalDeliverable.name,
      typeLabel: "منشور",
      statusLabel: "بانتظار موافقتك",
      versionLabel: "النسخة المعتمدة للعميل",
      dueDateLabel: r007ClientPortalDeliverable.clientDueDate,
    },
    statusLabel: "بانتظار موافقتك",
    progressPercentage: r007ClientPortalDeliverable.progressPercentage,
    files,
    comments,
  };
};

async function submitR007ClientPortalApproval(formData: FormData) {
  "use server";

  if (!canUseRouteActorFixtures()) {
    const actionKind = String(formData.get("clientApprovalAction") ?? "");
    if (actionKind !== "approve" && actionKind !== "request_changes") {
      return;
    }

    const result = await decidePersistentClientVersion({
      supabase: await createSupabaseServerClient(),
      input: {
        clientId: String(formData.get("clientId") ?? ""),
        deliverableId: String(formData.get("deliverableId") ?? ""),
        versionId: String(formData.get("versionId") ?? ""),
        decision: actionKind === "approve" ? "approved" : "changes_requested",
        comment: String(formData.get("reason") ?? ""),
        idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
      },
    });
    if (result.ok) {
      revalidatePath("/client");
    }
    return;
  }

  const actionKind = String(formData.get("clientApprovalAction") ?? "");
  const input = {
    clientId: String(formData.get("clientId") ?? ""),
    deliverableId: String(formData.get("deliverableId") ?? ""),
    versionId: String(formData.get("versionId") ?? ""),
    expectedRevision: Number(formData.get("expectedRevision") ?? 0),
    reason: String(formData.get("reason") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  };
  const dependencies = {
    actor: resolveRouteActor("client_approver_a"),
    approvals: new InMemoryApprovalRepository({
      versions: [r007ClientPortalVersion],
    }),
    deliverables: new InMemoryDeliverableRepository({
      deliverables: [r007ClientPortalDeliverable],
    }),
    audit: new InMemoryAuditSink(),
  };

  if (actionKind === "approve") {
    await approveAsClientCommand({ ...dependencies, input });
  }

  if (actionKind === "request_changes") {
    await requestClientChangesCommand({ ...dependencies, input });
  }
}

export default async function ClientPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const params = await searchParams;
  const runtime = await resolveRouteRuntime(
    params?.as ?? (canUseRouteActorFixtures() ? "client_viewer_a" : undefined),
  );

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
  const primaryClient = clients.find((client) =>
    actor.roleAssignments.some(
      (assignment) =>
        assignment.status === "active" &&
        assignment.scopeType === "client" &&
        assignment.scopeId === client.id,
    ),
  );

  if (!primaryClient) {
    return <NoAssignedClientState returnHref="/sign-in" />;
  }

  const access = guardClientDetailRoute({
    actor,
    clientId: primaryClient.id,
    clients,
  });

  if (!access.allowed) {
    return <AccessDeniedState />;
  }

  const navigation = resolveRoleAwareNavigation({
    actor,
    assignedClients: clients.filter((client) => client.id === primaryClient.id),
  });
  const summary = canUseRouteActorFixtures()
    ? { ok: true as const, value: fixtureClientCommercialSummary }
    : await readCommercialSummary({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
        audience: "client",
      });
  const stats =
    summary.ok && summary.value.audience === "client"
      ? buildClientMvpStats(summary.value)
      : buildEmptyMvpStats();
  const canApprove = evaluatePermission({
    actor,
    permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
    resource: { tenantId: primaryClient.tenantId, clientId: primaryClient.id },
  }).allowed;
  const portalDetail = canUseRouteActorFixtures()
    ? buildR007ClientPortalDetail({ actor, clientId: primaryClient.id })
    : await readPersistentClientApprovalDetail({
        supabase: await createSupabaseServerClient(),
        tenantId: primaryClient.tenantId,
        clientId: primaryClient.id,
      });

  return (
    <>
      <RoleAwareNavigation items={navigation.items} label="تنقل بوابة العميل" />
      <ClientHome clientName={primaryClient.name} stats={stats}>
        {portalDetail ? (
          <ClientDeliverableDetail
            approveAction={
              canApprove ? submitR007ClientPortalApproval : undefined
            }
            canApprove={canApprove}
            detail={portalDetail}
            requestChangesAction={
              canApprove ? submitR007ClientPortalApproval : undefined
            }
          />
        ) : null}
      </ClientHome>
    </>
  );
}
