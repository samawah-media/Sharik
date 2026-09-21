import type { DeliverableSafeSummary } from "./deliverable-repository";
import type { DeliverableWorkspaceSummary } from "./deliverable-workspace";
import type { DeliverableLifecycleStatus } from "./deliverable-rules";
import { deriveSlaStatus, selectApplicableDueBoundary } from "../sla/sla-policy";
import type { AuthorizationActor, ResourceScope } from "../authorization/evaluator";
import { isActive } from "../memberships/membership";

export type TeamWorkRelationship =
  | "owner"
  | "contributor"
  | "open_assigned_task"
  | "role_context";

export type TeamWorkCapabilities = {
  canApproveInternally: boolean;
  canManageDelivery: boolean;
  canSendToClient: boolean;
  canSubmitVersion: boolean;
  canUpdateStatus: boolean;
};

export type TeamWorkPresentation = {
  deliverable: DeliverableSafeSummary;
  relationship: TeamWorkRelationship;
  relationshipLabel: string;
  needsActorAction: boolean;
  nextAction: string;
  slaStatus: ReturnType<typeof deriveSlaStatus>["status"];
};

const relationshipLabels: Record<TeamWorkRelationship, string> = {
  owner: "أنت المسؤول",
  contributor: "أنت مشارك في المخرج",
  open_assigned_task: "عندك مهمة داخل المخرج",
  role_context: "ظاهر لك بحكم دورك",
};

const noCapabilities: TeamWorkCapabilities = {
  canApproveInternally: false,
  canManageDelivery: false,
  canSendToClient: false,
  canSubmitVersion: false,
  canUpdateStatus: false,
};

const managementWorkflowRoles = new Set<string>([
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
]);

export const hasManagementWorkflowAuthority = ({
  actor,
  resource,
}: {
  actor: AuthorizationActor;
  resource: Required<ResourceScope>;
}) => {
  if (
    actor.tenantId !== resource.tenantId ||
    !isActive(actor.tenantMembership.status)
  ) {
    return false;
  }
  return actor.roleAssignments.some(
    (assignment) =>
      isActive(assignment.status) &&
      assignment.tenantId === resource.tenantId &&
      managementWorkflowRoles.has(assignment.roleKey) &&
      (assignment.scopeType === "tenant"
        ? assignment.scopeId === resource.tenantId
        : assignment.scopeId === resource.clientId),
  );
};

const relationshipFor = ({
  actorUserId,
  deliverable,
  hasOpenAssignedTask,
}: {
  actorUserId: string;
  deliverable: DeliverableSafeSummary;
  hasOpenAssignedTask: boolean;
}): TeamWorkRelationship => {
  if (deliverable.ownerUserId === actorUserId) return "owner";
  if (deliverable.contributorUserIds.includes(actorUserId)) return "contributor";
  if (hasOpenAssignedTask) return "open_assigned_task";
  return "role_context";
};

type NextAction = Pick<
  TeamWorkPresentation,
  "needsActorAction" | "nextAction"
>;

type NextActionContext = {
  capabilities: TeamWorkCapabilities;
  deliverable: DeliverableSafeSummary;
  assignedToDeliverable: boolean;
};

const actorAction = (nextAction: string): NextAction => ({
  needsActorAction: true,
  nextAction,
});

const noActorAction = (nextAction: string): NextAction => ({
  needsActorAction: false,
  nextAction,
});

const statusActions: Record<
  DeliverableLifecycleStatus,
  (context: NextActionContext) => NextAction
> = {
  not_started: ({ assignedToDeliverable, capabilities }) => {
    if (assignedToDeliverable && capabilities.canSubmitVersion) {
      return actorAction("ابدأ العمل وارفع النسخة للمراجعة الداخلية.");
    }
    return capabilities.canUpdateStatus
      ? actorAction("ابدأ التنفيذ بتحديث حالة المخرج.")
      : noActorAction("بانتظار تنفيذ المسؤول — ما عليك إجراء الآن");
  },
  in_progress: ({ assignedToDeliverable, capabilities }) =>
    assignedToDeliverable && capabilities.canSubmitVersion
      ? actorAction("أكمل العمل وارفع النسخة للمراجعة الداخلية.")
      : noActorAction("بانتظار تنفيذ المسؤول — ما عليك إجراء الآن"),
  ready_for_internal_review: ({ capabilities }) =>
    capabilities.canApproveInternally
      ? actorAction("راجع النسخة واتخذ قرار الاعتماد الداخلي.")
      : noActorAction("بانتظار مراجعة الإدارة — ما عليك إجراء الآن"),
  internal_changes_requested: ({ assignedToDeliverable, capabilities }) =>
    assignedToDeliverable && capabilities.canSubmitVersion
      ? actorAction("نفّذ التعديلات الداخلية وارفع نسخة محدثة.")
      : noActorAction(
          "بانتظار تنفيذ التعديلات الداخلية — ما عليك إجراء الآن",
        ),
  internally_approved: ({ capabilities, deliverable }) => {
    if (deliverable.requiresClientApproval) {
      return capabilities.canSendToClient
        ? actorAction("أرسل النسخة المعتمدة للعميل.")
        : noActorAction("بانتظار إرسال الإدارة للعميل — ما عليك إجراء الآن");
    }
    return capabilities.canManageDelivery
      ? actorAction("جهّز النسخة المعتمدة للتسليم.")
      : noActorAction("بانتظار تجهيز الإدارة للتسليم — ما عليك إجراء الآن");
  },
  waiting_client_approval: () =>
    noActorAction("بانتظار قرار العميل — ما عليك إجراء الآن"),
  client_changes_requested: ({ assignedToDeliverable, capabilities }) =>
    assignedToDeliverable && capabilities.canSubmitVersion
      ? actorAction("نفّذ تعديلات العميل وارفع نسخة محدثة.")
      : noActorAction("بانتظار تنفيذ تعديلات العميل — ما عليك إجراء الآن"),
  client_approved: ({ capabilities }) =>
    capabilities.canManageDelivery
      ? actorAction("جهّز النسخة المعتمدة للتسليم.")
      : noActorAction("بانتظار تجهيز الإدارة للتسليم — ما عليك إجراء الآن"),
  ready_for_delivery: ({ capabilities }) =>
    capabilities.canManageDelivery
      ? actorAction("راجع الملفات وأكّد التسليم النهائي.")
      : noActorAction("بانتظار تأكيد الإدارة للتسليم — ما عليك إجراء الآن"),
  delivered: () => noActorAction("المخرج مكتمل — ما عليك إجراء الآن"),
  cancelled: () => noActorAction("المخرج ملغي — ما عليك إجراء الآن"),
  archived: () => noActorAction("المخرج مؤرشف — ما عليك إجراء الآن"),
};

const terminalStatuses = new Set<DeliverableLifecycleStatus>([
  "delivered",
  "cancelled",
  "archived",
]);

const nextActionFor = ({
  capabilities,
  deliverable,
  hasOpenAssignedTask,
  relationship,
}: {
  capabilities: TeamWorkCapabilities;
  deliverable: DeliverableSafeSummary;
  hasOpenAssignedTask: boolean;
  relationship: TeamWorkRelationship;
}): NextAction => {
  const assignedToDeliverable =
    relationship === "owner" || relationship === "contributor";
  if (!terminalStatuses.has(deliverable.status) && hasOpenAssignedTask) {
    return actorAction("أكمل المهمة المفتوحة المسندة لك داخل المخرج.");
  }
  return statusActions[deliverable.status]({
    assignedToDeliverable,
    capabilities,
    deliverable,
  });
};

const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
const slaRank = { overdue: 0, at_risk: 1 } as const;
const dateRank = (value: string | undefined, fallback: number) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
};

const compareRanks = (left: number, right: number) => {
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

const effectiveDueDate = (deliverable: DeliverableSafeSummary) =>
  selectApplicableDueBoundary(deliverable)?.value ??
  deliverable.plannedPublishDate;

const compareTeamWork = (
  left: TeamWorkPresentation,
  right: TeamWorkPresentation,
) => {
  if (left.needsActorAction !== right.needsActorAction) {
    return left.needsActorAction ? -1 : 1;
  }
  const slaDifference =
    (slaRank[left.slaStatus as keyof typeof slaRank] ?? 2) -
    (slaRank[right.slaStatus as keyof typeof slaRank] ?? 2);
  if (slaDifference !== 0) return slaDifference;
  const dueDifference =
    compareRanks(
      dateRank(effectiveDueDate(left.deliverable), Number.POSITIVE_INFINITY),
      dateRank(effectiveDueDate(right.deliverable), Number.POSITIVE_INFINITY),
    );
  if (dueDifference !== 0) return dueDifference;
  const priorityDifference =
    priorityRank[left.deliverable.priority] -
    priorityRank[right.deliverable.priority];
  if (priorityDifference !== 0) return priorityDifference;
  const updatedDifference =
    compareRanks(
      dateRank(right.deliverable.updatedAt, Number.NEGATIVE_INFINITY),
      dateRank(left.deliverable.updatedAt, Number.NEGATIVE_INFINITY),
    );
  if (updatedDifference !== 0) return updatedDifference;
  return left.deliverable.id.localeCompare(right.deliverable.id, "en");
};

const projectDeliverable = ({
  actorUserId,
  capabilities,
  deliverable,
  now,
  summary,
}: {
  actorUserId: string;
  capabilities: TeamWorkCapabilities;
  deliverable: DeliverableSafeSummary;
  now: string;
  summary?: DeliverableWorkspaceSummary;
}): TeamWorkPresentation => {
  const hasOpenAssignedTask = summary?.hasOpenAssignedTask === true;
  const relationship = relationshipFor({
    actorUserId,
    deliverable,
    hasOpenAssignedTask,
  });
  const slaStatus = deriveSlaStatus({
    status: deliverable.status,
    now,
    startDate: deliverable.startDate,
    internalDueDate: deliverable.internalDueDate,
    clientDueDate: deliverable.clientDueDate,
    finalDueDate: deliverable.finalDueDate,
  }).status;
  return {
    deliverable,
    relationship,
    relationshipLabel: relationshipLabels[relationship],
    slaStatus,
    ...nextActionFor({
      capabilities,
      deliverable,
      hasOpenAssignedTask,
      relationship,
    }),
  };
};

export function projectTeamWork({
  actorUserId,
  capabilitiesByDeliverable,
  deliverables,
  now,
  workspaces,
}: {
  actorUserId: string;
  capabilitiesByDeliverable: Record<string, TeamWorkCapabilities>;
  deliverables: DeliverableSafeSummary[];
  now: string;
  workspaces: Record<string, DeliverableWorkspaceSummary>;
}): TeamWorkPresentation[] {
  return deliverables
    .map((deliverable) =>
      projectDeliverable({
        actorUserId,
        capabilities:
          capabilitiesByDeliverable[deliverable.id] ?? noCapabilities,
        deliverable,
        now,
        summary: workspaces[deliverable.id],
      }),
    )
    .sort(compareTeamWork);
}
