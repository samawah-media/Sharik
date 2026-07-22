import {
  canR008ActorApproveClientItem,
  type R008ApprovalAuthorityDecision,
} from "@/modules/authorization/r008-persona-scope";
import type {
  R008ApprovalEvidenceItem,
  R008IsolationProofActors,
} from "@/modules/release/r008-isolation-proof";

export type R008ApprovalJourneyScenarioId =
  | "current_version_approval"
  | "stale_version_denial"
  | "client_viewer_denial"
  | "approver_scope_denial";

export type R008ApprovalJourneyScenario = {
  scenario: R008ApprovalJourneyScenarioId;
  result: "allowed" | "denied";
  persona: "client_approver" | "client_viewer";
  clientId: string;
  deliverableId: string;
  versionState: R008ApprovalEvidenceItem["versionState"];
  visibleToClient: boolean;
  reason?: Exclude<R008ApprovalAuthorityDecision, { allowed: true }>["reason"];
  auditRequired: true;
  auditAction: "ClientApprovalRecorded" | "ClientApprovalDenied";
  slaImpact:
    | "client_approval_keeps_delivery_path"
    | "denial_does_not_change_sla";
  versionBoundToCurrent: boolean;
  customerDataExposed: false;
};

export type R008ApprovalJourneyProbe = {
  scenarios: R008ApprovalJourneyScenario[];
  customerDataExposed: false;
};

export type R008ApprovalJourneySummary = {
  scenarioCount: number;
  allowedCount: number;
  deniedCount: number;
  auditRequiredForAll: boolean;
  staleVersionDenied: boolean;
  viewerDenied: boolean;
  approverScopeDenied: boolean;
  currentVersionApprovalAllowed: boolean;
  customerDataExposed: false;
};

const findItem = ({
  items,
  clientId,
  versionState,
}: {
  items: readonly R008ApprovalEvidenceItem[];
  clientId: string;
  versionState: R008ApprovalEvidenceItem["versionState"];
}) => {
  const item = items.find(
    (candidate) =>
      candidate.clientId === clientId &&
      candidate.versionState === versionState,
  );

  if (!item) {
    throw new Error("R008_APPROVAL_JOURNEY_FIXTURE_MISSING");
  }

  return item;
};

const scenarioFor = ({
  decision,
  item,
  persona,
  scenario,
}: {
  decision: R008ApprovalAuthorityDecision;
  item: R008ApprovalEvidenceItem;
  persona: R008ApprovalJourneyScenario["persona"];
  scenario: R008ApprovalJourneyScenarioId;
}): R008ApprovalJourneyScenario => ({
  scenario,
  result: decision.allowed ? "allowed" : "denied",
  persona,
  clientId: item.clientId,
  deliverableId: item.deliverableId,
  versionState: item.versionState,
  visibleToClient: item.visibleToClient,
  reason: decision.allowed ? undefined : decision.reason,
  auditRequired: true,
  auditAction: decision.allowed
    ? "ClientApprovalRecorded"
    : "ClientApprovalDenied",
  slaImpact: decision.allowed
    ? "client_approval_keeps_delivery_path"
    : "denial_does_not_change_sla",
  versionBoundToCurrent:
    decision.allowed && item.versionState === "current_client_visible_version",
  customerDataExposed: false,
});

export const buildR008ApprovalJourneyProbe = ({
  actors,
  approvalItems,
  currentClientId,
  comparisonClientId,
}: {
  actors: R008IsolationProofActors;
  approvalItems: readonly R008ApprovalEvidenceItem[];
  currentClientId: string;
  comparisonClientId: string;
}): R008ApprovalJourneyProbe => {
  const currentItem = findItem({
    items: approvalItems,
    clientId: currentClientId,
    versionState: "current_client_visible_version",
  });
  const staleItem = findItem({
    items: approvalItems,
    clientId: currentClientId,
    versionState: "stale_version",
  });
  const comparisonItem = findItem({
    items: approvalItems,
    clientId: comparisonClientId,
    versionState: "current_client_visible_version",
  });

  return {
    customerDataExposed: false,
    scenarios: [
      scenarioFor({
        scenario: "current_version_approval",
        persona: "client_approver",
        item: currentItem,
        decision: canR008ActorApproveClientItem({
          actor: actors.clientApproverA,
          tenantId: currentItem.tenantId,
          clientId: currentItem.clientId,
          visibleToClient: currentItem.visibleToClient,
          versionState: currentItem.versionState,
        }),
      }),
      scenarioFor({
        scenario: "stale_version_denial",
        persona: "client_approver",
        item: staleItem,
        decision: canR008ActorApproveClientItem({
          actor: actors.clientApproverA,
          tenantId: staleItem.tenantId,
          clientId: staleItem.clientId,
          visibleToClient: staleItem.visibleToClient,
          versionState: staleItem.versionState,
        }),
      }),
      scenarioFor({
        scenario: "client_viewer_denial",
        persona: "client_viewer",
        item: currentItem,
        decision: canR008ActorApproveClientItem({
          actor: actors.clientViewerA,
          tenantId: currentItem.tenantId,
          clientId: currentItem.clientId,
          visibleToClient: currentItem.visibleToClient,
          versionState: currentItem.versionState,
        }),
      }),
      scenarioFor({
        scenario: "approver_scope_denial",
        persona: "client_approver",
        item: comparisonItem,
        decision: canR008ActorApproveClientItem({
          actor: actors.clientApproverA,
          tenantId: comparisonItem.tenantId,
          clientId: comparisonItem.clientId,
          visibleToClient: comparisonItem.visibleToClient,
          versionState: comparisonItem.versionState,
        }),
      }),
    ],
  };
};

export const summarizeR008ApprovalJourneyProbe = (
  probe: R008ApprovalJourneyProbe,
): R008ApprovalJourneySummary => {
  const scenario = (id: R008ApprovalJourneyScenarioId) =>
    probe.scenarios.find((item) => item.scenario === id);

  return {
    scenarioCount: probe.scenarios.length,
    allowedCount: probe.scenarios.filter((item) => item.result === "allowed")
      .length,
    deniedCount: probe.scenarios.filter((item) => item.result === "denied")
      .length,
    auditRequiredForAll: probe.scenarios.every((item) => item.auditRequired),
    staleVersionDenied:
      scenario("stale_version_denial")?.reason === "stale_version_denied",
    viewerDenied:
      scenario("client_viewer_denial")?.reason === "permission_not_granted",
    approverScopeDenied:
      scenario("approver_scope_denial")?.reason === "permission_not_granted",
    currentVersionApprovalAllowed:
      scenario("current_version_approval")?.result === "allowed",
    customerDataExposed: false,
  };
};
