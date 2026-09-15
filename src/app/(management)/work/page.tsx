import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import {
  hasManagementWorkflowAuthority,
  type TeamWorkCapabilities,
} from "@/modules/deliverables/team-work-presentation";
import { listScopedDeliverableWorkspaceSummaries } from "@/server/actions/deliverable-workspace-read";
import { updateDeliverableStatusAction } from "@/server/actions/deliverable-status";
import { resolveRouteRuntime } from "@/server/navigation/route-guards";
import { PageHeader } from "@/ui/layout/page-header";
import { TeamWorkspace } from "@/ui/management/team-workspace";
import {
  AccessDeniedState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

export const dynamic = "force-dynamic";

export default async function AssignedWorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const query = await searchParams;
  const runtime = await resolveRouteRuntime(query?.as);
  if (!runtime.ok) {
    return runtime.reason === "auth_required" ||
      runtime.reason === "session_expired" ? (
      <SessionExpiredState />
    ) : (
      <AccessDeniedState returnHref="/sign-in" />
    );
  }

  const clientResults = await Promise.all(
    runtime.clients.map(async (client) => ({
      client,
      result: await listScopedDeliverables({
        tenantId: client.tenantId,
        clientId: client.id,
      }),
    })),
  );
  const deliverables = clientResults.flatMap(({ result }) =>
    result.ok
      ? result.deliverables.filter(
          (deliverable) =>
            deliverable.ownerUserId === runtime.actor.userId ||
            deliverable.contributorUserIds.includes(runtime.actor.userId) ||
            evaluatePermission({
              actor: runtime.actor,
              permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
              resource: {
                tenantId: deliverable.tenantId,
                clientId: deliverable.clientId,
              },
            }).allowed ||
            evaluatePermission({
              actor: runtime.actor,
              permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
              resource: {
                tenantId: deliverable.tenantId,
                clientId: deliverable.clientId,
              },
            }).allowed ||
            evaluatePermission({
              actor: runtime.actor,
              permission: PERMISSIONS.DELIVERABLE_VERSION_SUBMIT,
              resource: {
                tenantId: deliverable.tenantId,
                clientId: deliverable.clientId,
              },
            }).allowed,
        )
      : [],
  );
  const workspaceEntries = await Promise.all(
    runtime.clients.map(async (client) => {
      const scoped = deliverables.filter((item) => item.clientId === client.id);
      return listScopedDeliverableWorkspaceSummaries({
        tenantId: client.tenantId,
        clientId: client.id,
        actorUserId: runtime.actor.userId,
        deliverables: scoped.map((item) => ({
          id: item.id,
          currentVersionId: item.currentVersionId,
        })),
      });
    }),
  );
  const canUpdate = runtime.clients.some(
    (client) =>
      evaluatePermission({
        actor: runtime.actor,
        permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
        resource: { tenantId: client.tenantId, clientId: client.id },
      }).allowed,
  );
  const canApprove = runtime.clients.some(
    (client) =>
      evaluatePermission({
        actor: runtime.actor,
        permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
        resource: { tenantId: client.tenantId, clientId: client.id },
      }).allowed,
  );
  const capabilitiesByDeliverable = Object.fromEntries(
    deliverables.map((deliverable) => {
      const resource = {
        tenantId: deliverable.tenantId,
        clientId: deliverable.clientId,
      };
      const allows = (permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) =>
        evaluatePermission({
          actor: runtime.actor,
          permission,
          resource,
        }).allowed;
      const capabilities: TeamWorkCapabilities = {
        canApproveInternally: allows(
          PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
        ),
        canManageDelivery: hasManagementWorkflowAuthority({
          actor: runtime.actor,
          resource,
        }),
        canSendToClient: allows(PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT),
        canSubmitVersion: allows(PERMISSIONS.DELIVERABLE_VERSION_SUBMIT),
        canUpdateStatus: allows(PERMISSIONS.DELIVERABLE_STATUS_UPDATE),
      };
      return [deliverable.id, capabilities];
    }),
  );

  return (
    <main className="grid gap-5" dir="rtl">
      <PageHeader
        title="مهامي"
        description="العمل المسند إليك من جميع العملاء المصرح بهم، من مصدر دائم واحد للقائمة واللوحة."
      />
      <TeamWorkspace
        actorUserId={runtime.actor.userId}
        approvalAction={canApprove ? updateDeliverableStatusAction : undefined}
        capabilitiesByDeliverable={capabilitiesByDeliverable}
        clientNames={Object.fromEntries(
          runtime.clients.map((client) => [client.id, client.name]),
        )}
        deliverables={deliverables}
        now={new Date().toISOString()}
        statusAction={canUpdate ? updateDeliverableStatusAction : undefined}
        workspaces={Object.assign({}, ...workspaceEntries)}
      />
    </main>
  );
}
