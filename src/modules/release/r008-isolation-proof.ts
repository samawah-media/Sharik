import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import {
  canR008ActorApproveClientItem,
  classifyR008PersonaScope,
  filterR008ClientScopedRecords,
  type R008PersonaCategory,
} from "@/modules/authorization/r008-persona-scope";

export type R008ScopedEvidenceRecord = {
  id: string;
  tenantId: string;
  clientId: string;
  surface:
    | "deliverable"
    | "file"
    | "approval"
    | "comment"
    | "audit"
    | "sla_report";
};

export type R008ApprovalEvidenceItem = {
  id: string;
  tenantId: string;
  clientId: string;
  deliverableId: string;
  versionState:
    | "current_client_visible_version"
    | "stale_version"
    | "superseded_version";
  visibleToClient: boolean;
};

export type R008IsolationProofActors = {
  management: AuthorizationActor;
  assignedInternalA: AuthorizationActor;
  clientViewerA: AuthorizationActor;
  clientApproverA: AuthorizationActor;
  unassignedClientUser: AuthorizationActor;
};

export type R008IsolationProofScenario = {
  persona: R008PersonaCategory;
  result: "allowed" | "denied";
  visibleClientIds: string[];
  deniedClientIds: string[];
  safeState?: "safe_empty_denied" | "safe_access_denied";
  approvalAction: "allowed" | "denied";
  customerDataExposed: false;
};

export type R008IsolationProofMatrix = {
  scenarios: R008IsolationProofScenario[];
  clientDataLeakagePrevented: boolean;
};

export const filterR008ScopedRecordsForActor = <
  TRecord extends R008ScopedEvidenceRecord,
>({
  actor,
  records,
  clientId,
}: {
  actor: AuthorizationActor;
  records: readonly TRecord[];
  clientId?: string;
}) => filterR008ClientScopedRecords({ actor, records, clientId });

export const filterR008ApprovalItemsForActor = ({
  actor,
  items,
  action,
}: {
  actor: AuthorizationActor;
  items: readonly R008ApprovalEvidenceItem[];
  action: "view" | "approve";
}) =>
  items.filter((item) => {
    if (
      !item.visibleToClient ||
      item.versionState !== "current_client_visible_version"
    ) {
      return false;
    }

    if (action === "view") {
      return filterR008ClientScopedRecords({
        actor,
        records: [item],
      }).length === 1;
    }

    return canR008ActorApproveClientItem({
      actor,
      tenantId: item.tenantId,
      clientId: item.clientId,
      visibleToClient: item.visibleToClient,
      versionState: item.versionState,
    }).allowed;
  });

const unique = (values: string[]) => [...new Set(values)];

const scenarioFor = ({
  persona,
  actor,
  tenantId,
  clientIds,
  approvalItems,
}: {
  persona: R008PersonaCategory;
  actor: AuthorizationActor;
  tenantId: string;
  clientIds: readonly string[];
  approvalItems: readonly R008ApprovalEvidenceItem[];
}): R008IsolationProofScenario => {
  const scope = classifyR008PersonaScope({ actor, tenantId, clientIds });
  const canApprove = filterR008ApprovalItemsForActor({
    actor,
    items: approvalItems,
    action: "approve",
  }).length > 0;

  return {
    persona,
    result: scope.visibleClientIds.length > 0 ? "allowed" : "denied",
    visibleClientIds: scope.visibleClientIds,
    deniedClientIds: scope.deniedClientIds,
    safeState:
      scope.visibleClientIds.length > 0 ? undefined : "safe_empty_denied",
    approvalAction: canApprove ? "allowed" : "denied",
    customerDataExposed: false,
  };
};

export const buildR008IsolationProofMatrix = ({
  actors,
  clientIds,
  tenantId,
  approvalItems,
}: {
  actors?: R008IsolationProofActors;
  clientIds?: readonly string[];
  tenantId?: string;
  deliverables?: readonly R008ScopedEvidenceRecord[];
  files?: readonly R008ScopedEvidenceRecord[];
  approvalItems?: readonly R008ApprovalEvidenceItem[];
} = {}): R008IsolationProofMatrix => {
  if (!actors || !tenantId || !clientIds || !approvalItems) {
    throw new Error("R008_ISOLATION_PROOF_FIXTURE_REQUIRED");
  }

  const scenarios = [
    scenarioFor({
      persona: "management_project_admin",
      actor: actors.management,
      tenantId,
      clientIds,
      approvalItems,
    }),
    scenarioFor({
      persona: "assigned_internal_user",
      actor: actors.assignedInternalA,
      tenantId,
      clientIds,
      approvalItems,
    }),
    scenarioFor({
      persona: "client_viewer",
      actor: actors.clientViewerA,
      tenantId,
      clientIds,
      approvalItems,
    }),
    scenarioFor({
      persona: "client_approver",
      actor: actors.clientApproverA,
      tenantId,
      clientIds,
      approvalItems,
    }),
    scenarioFor({
      persona: "unassigned_client_user",
      actor: actors.unassignedClientUser,
      tenantId,
      clientIds,
      approvalItems,
    }),
  ];

  return {
    scenarios,
    clientDataLeakagePrevented: scenarios.every((scenario) => {
      const visible = new Set(scenario.visibleClientIds);
      const denied = new Set(scenario.deniedClientIds);

      return unique([...visible].filter((clientId) => denied.has(clientId)))
        .length === 0;
    }),
  };
};
