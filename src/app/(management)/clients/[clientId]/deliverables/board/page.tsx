import { isPostPackageLine } from "@/modules/packages/package-quantity";
import { listEligibleDeliverableMembers } from "@/server/actions/deliverable-member-read";
import { listFirstActivePackageLines } from "@/server/actions/deliverable-package-read";
import { createQuickPostAction } from "@/server/actions/quick-post";
import type { QuickPostOptions } from "@/ui/management/quick-post-form";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import { listScopedDeliverableWorkspaceSummaries } from "@/server/actions/deliverable-workspace-read";
import { updateDeliverableStatusAction } from "@/server/actions/deliverable-status";
import {
  guardClientDetailRoute,
  resolveRouteRuntime,
} from "@/server/navigation/route-guards";
import {
  DeliverableBoard,
  DeliverableBoardEmptyState,
} from "@/ui/management/deliverable-board";
import { DeliverableDeniedState } from "@/ui/management/deliverable-form";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { PageHeader } from "@/ui/layout/page-header";
import { formatMvpClientName } from "@/ui/mvp/hadna-mvp-summary";
import {
  AccessDeniedState,
  ClientUnavailableState,
  MembershipDisabledState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

export default async function ClientDeliverablesBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ as?: string; saved?: string }>;
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

  const canUpdateDeliverableStatus = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;
  const canUseApprovalWorkflow =
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed ||
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed;
  const canSubmitDeliverableVersion = evaluatePermission({
    actor: runtime.actor,
    permission: PERMISSIONS.DELIVERABLE_VERSION_SUBMIT,
    resource: { tenantId: client.tenantId, clientId: client.id },
  }).allowed;

  const canCreatePost =
    client.status === "active" &&
    evaluatePermission({
      actor: runtime.actor,
      permission: PERMISSIONS.DELIVERABLE_CREATE,
      resource: { tenantId: client.tenantId, clientId: client.id },
    }).allowed;

  if (
    !canCreatePost &&
    !canUpdateDeliverableStatus &&
    !canSubmitDeliverableVersion &&
    !canUseApprovalWorkflow
  ) {
    return <DeliverableDeniedState />;
  }

  const deliverableList = await listScopedDeliverables({
    tenantId: client.tenantId,
    clientId: client.id,
  });

  if (!deliverableList.ok) {
    return <DeliverableDeniedState />;
  }
  const visibleDeliverables =
    canUpdateDeliverableStatus || canUseApprovalWorkflow
      ? deliverableList.deliverables
      : deliverableList.deliverables.filter(
          (deliverable) =>
            deliverable.ownerUserId === runtime.actor.userId ||
            deliverable.contributorUserIds.includes(runtime.actor.userId) ||
            evaluatePermission({
              actor: runtime.actor,
              permission: PERMISSIONS.DELIVERABLE_VERSION_SUBMIT,
              resource: { tenantId: client.tenantId, clientId: client.id },
            }).allowed,
        );
  const displayClientName = formatMvpClientName(client.name);
  const [workspaces, quickPost] = await Promise.all([
    listScopedDeliverableWorkspaceSummaries({
      tenantId: client.tenantId,
      clientId: client.id,
      deliverables: visibleDeliverables.map((deliverable) => ({
        id: deliverable.id,
        currentVersionId: deliverable.currentVersionId,
      })),
    }),
    canCreatePost
      ? loadQuickPostOptions(client.tenantId, client.id)
      : undefined,
  ]);

  return (
    <main className="grid gap-2" dir="rtl">
      <PageHeader
        className="flex-row items-center gap-2 border-0 pb-1 sm:items-center [&_h1]:text-xl [&_h1]:leading-7 [&_h1]:sm:text-xl [&_h1+div]:mt-0 [&_h1+div]:line-clamp-1 [&_h1+div]:text-xs [&_h1+div]:leading-5"
        actions={
          <ButtonLink
            href={`/clients/${client.id}/deliverables`}
            variant="secondary"
          >
            قائمة المخرجات
          </ButtonLink>
        }
        description={displayClientName}
        status={
          query?.saved ? (
            <div className="flex flex-wrap gap-2">
              {query?.saved === "status-updated" ? (
                <Badge tone="success">تم تحديث حالة المخرج.</Badge>
              ) : null}
              {query?.saved === "denied" ? (
                <Badge tone="danger">تعذر تنفيذ تغيير الحالة بأمان.</Badge>
              ) : null}
            </div>
          ) : undefined
        }
        title="لوحة العمل"
      />
      {visibleDeliverables.length > 0 || quickPost ? (
        <DeliverableBoard
          actorUserId={runtime.actor.userId}
          action={
            canUpdateDeliverableStatus
              ? updateDeliverableStatusAction
              : undefined
          }
          approvalAction={
            canUseApprovalWorkflow ? updateDeliverableStatusAction : undefined
          }
          clientNames={{ [client.id]: displayClientName }}
          deliverables={visibleDeliverables}
          quickPost={quickPost}
          key={
            quickPost
              ? client.id
              : visibleDeliverables
                  .map(
                    (deliverable) =>
                      `${deliverable.id}:${deliverable.revision}`,
                  )
                  .join("|")
          }
          workspaces={workspaces}
        />
      ) : (
        <DeliverableBoardEmptyState />
      )}
    </main>
  );
}

async function loadQuickPostOptions(
  tenantId: string,
  clientId: string,
): Promise<QuickPostOptions> {
  const [context, eligible] = await Promise.all([
    listFirstActivePackageLines({ tenantId, clientId }),
    listEligibleDeliverableMembers({ tenantId, clientId }),
  ]);
  const postLines = context.ok
    ? context.packageLines.filter(isPostPackageLine)
    : [];
  const lines = postLines
    .filter((line) => line.balance.available >= 1)
    .map((line) => ({
      id: line.id,
      label: line.serviceLabel,
      available: line.balance.available,
    }));
  let unavailableMessage;
  if (!context.ok && context.reason === "unavailable") {
    unavailableMessage = "تعذّر تحميل رصيد المنشورات. جرّب تحديث الرصيد.";
  } else if (postLines.length === 0) {
    unavailableMessage = "لا يوجد بند منشورات في الباقة الحالية لهذا العميل.";
  } else if (lines.length === 0) {
    unavailableMessage = "رصيد المنشورات في الباقة الحالية انتهى.";
  }

  return {
    action: createQuickPostAction.bind(null, clientId),
    lines,
    members: eligible.members.map(({ userId, displayName }) => ({
      userId,
      displayName,
    })),
    unavailableMessage,
  };
}
