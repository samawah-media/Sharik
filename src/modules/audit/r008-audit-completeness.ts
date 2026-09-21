import type { AuditEvent } from "./audit-service";

export const R008_AUDIT_EVENT_CATEGORIES = [
  "internal_approval",
  "internal_change_request",
  "send_to_client",
  "client_approval",
  "client_change_request",
  "delivery",
  "file_visibility_change",
  "file_access_denial",
  "sla_pause_resume",
  "package_affecting_change",
  "security_denial",
] as const;

export type R008AuditEventCategory =
  (typeof R008_AUDIT_EVENT_CATEGORIES)[number];

export type R008AuditCompletenessRequirement = {
  category: R008AuditEventCategory;
  successActions: string[];
  denialActions: string[];
  successRequired: boolean;
  denialRequired: boolean;
};

export type R008AuditCompletenessRow = {
  category: R008AuditEventCategory;
  successPathCovered: boolean;
  denialPathCovered: boolean;
  complete: boolean;
  blockers: string[];
};

export type R008AuditCompletenessMatrix = {
  rows: R008AuditCompletenessRow[];
  customerDataExposed: false;
};

export type R008AuditCompletenessSummary = {
  complete: boolean;
  completeCount: number;
  blockerCount: number;
  missingCategories: R008AuditEventCategory[];
};

const requirements: R008AuditCompletenessRequirement[] = [
  {
    category: "internal_approval",
    successActions: ["InternalApprovalRecorded"],
    denialActions: ["InternalApprovalDenied"],
    successRequired: true,
    denialRequired: false,
  },
  {
    category: "internal_change_request",
    successActions: ["InternalChangesRequested"],
    denialActions: ["InternalChangesDenied"],
    successRequired: true,
    denialRequired: false,
  },
  {
    category: "send_to_client",
    successActions: ["DeliverableSentToClient"],
    denialActions: ["SendToClientDenied"],
    successRequired: true,
    denialRequired: true,
  },
  {
    category: "client_approval",
    successActions: ["ClientApprovalRecorded"],
    denialActions: ["ClientApprovalDenied"],
    successRequired: true,
    denialRequired: true,
  },
  {
    category: "client_change_request",
    successActions: ["ClientChangesRequested"],
    denialActions: ["ClientChangesDenied"],
    successRequired: true,
    denialRequired: false,
  },
  {
    category: "delivery",
    successActions: ["DeliverableDelivered"],
    denialActions: ["DeliveryDenied"],
    successRequired: true,
    denialRequired: true,
  },
  {
    category: "file_visibility_change",
    successActions: ["FileVisibilityChanged"],
    denialActions: ["FileVisibilityDenied"],
    successRequired: true,
    denialRequired: true,
  },
  {
    category: "file_access_denial",
    successActions: [],
    denialActions: ["FileAccessDenied"],
    successRequired: false,
    denialRequired: true,
  },
  {
    category: "sla_pause_resume",
    successActions: ["SLAPaused", "SLAResumed"],
    denialActions: [],
    successRequired: true,
    denialRequired: false,
  },
  {
    category: "package_affecting_change",
    successActions: ["PackageLedgerAdjusted"],
    denialActions: ["PackageLedgerDenied"],
    successRequired: true,
    denialRequired: true,
  },
  {
    category: "security_denial",
    successActions: [],
    denialActions: ["AuthorizationDenied", "SecurityDenied"],
    successRequired: false,
    denialRequired: true,
  },
];

const hasAllActions = (
  events: readonly AuditEvent[],
  actions: readonly string[],
) =>
  actions.length > 0 &&
  actions.every((action) => events.some((event) => event.action === action));

export const buildR008AuditCompletenessMatrix = (
  events: readonly AuditEvent[],
): R008AuditCompletenessMatrix => ({
  customerDataExposed: false,
  rows: requirements.map((requirement) => {
    const successPathCovered = requirement.successRequired
      ? hasAllActions(events, requirement.successActions)
      : true;
    const denialPathCovered = requirement.denialRequired
      ? requirement.denialActions.some((action) =>
          events.some((event) => event.action === action),
        )
      : true;
    const blockers: string[] = [];

    if (!successPathCovered) {
      blockers.push("success_audit_missing");
    }

    if (!denialPathCovered) {
      blockers.push("denial_audit_missing");
    }

    return {
      category: requirement.category,
      successPathCovered,
      denialPathCovered,
      complete: blockers.length === 0,
      blockers,
    };
  }),
});

export const summarizeR008AuditCompleteness = (
  matrix: R008AuditCompletenessMatrix,
): R008AuditCompletenessSummary => {
  const missingCategories = matrix.rows
    .filter((row) => !row.complete)
    .map((row) => row.category);

  return {
    complete: missingCategories.length === 0,
    completeCount: matrix.rows.filter((row) => row.complete).length,
    blockerCount: missingCategories.length,
    missingCategories,
  };
};

const event = ({
  action,
  decision,
}: Pick<AuditEvent, "action" | "decision">): AuditEvent => ({
  tenantId: "tenant_r008_local",
  clientId: "client_r008_a",
  actorUserId: "r008_actor",
  action,
  decision,
  targetType: "deliverable",
  targetId: "r008_local_target",
});

export const buildR008CompleteAuditFixtureEvents = (): AuditEvent[] => [
  event({ action: "InternalApprovalRecorded", decision: "allowed" }),
  event({ action: "InternalChangesRequested", decision: "allowed" }),
  event({ action: "DeliverableSentToClient", decision: "allowed" }),
  event({ action: "SendToClientDenied", decision: "denied" }),
  event({ action: "ClientApprovalRecorded", decision: "allowed" }),
  event({ action: "ClientApprovalDenied", decision: "denied" }),
  event({ action: "ClientChangesRequested", decision: "allowed" }),
  event({ action: "DeliverableDelivered", decision: "allowed" }),
  event({ action: "DeliveryDenied", decision: "denied" }),
  event({ action: "FileVisibilityChanged", decision: "allowed" }),
  event({ action: "FileVisibilityDenied", decision: "denied" }),
  event({ action: "FileAccessDenied", decision: "denied" }),
  event({ action: "SLAPaused", decision: "allowed" }),
  event({ action: "SLAResumed", decision: "allowed" }),
  event({ action: "PackageLedgerAdjusted", decision: "allowed" }),
  event({ action: "PackageLedgerDenied", decision: "denied" }),
  event({ action: "SecurityDenied", decision: "denied" }),
];
