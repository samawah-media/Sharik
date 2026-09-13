import { describe, expect, it } from "vitest";
import {
  buildR008ApprovalJourneyProbe,
  summarizeR008ApprovalJourneyProbe,
} from "@/modules/approvals/r008-approval-journey";
import {
  r008Actors,
  r008ScopedApprovalItems,
  r008SyntheticClientA,
  r008SyntheticClientB,
} from "../../fixtures/r008-fixtures";

describe("R-008 client approval journey probe", () => {
  it("proves current-version approval, stale denial, viewer denial, and approver scope", () => {
    const probe = buildR008ApprovalJourneyProbe({
      actors: r008Actors,
      approvalItems: r008ScopedApprovalItems,
      currentClientId: r008SyntheticClientA.id,
      comparisonClientId: r008SyntheticClientB.id,
    });

    expect(probe.scenarios).toMatchObject([
      {
        scenario: "current_version_approval",
        result: "allowed",
        versionState: "current_client_visible_version",
        auditRequired: true,
        versionBoundToCurrent: true,
      },
      {
        scenario: "stale_version_denial",
        result: "denied",
        reason: "stale_version_denied",
        auditRequired: true,
        versionBoundToCurrent: false,
      },
      {
        scenario: "client_viewer_denial",
        result: "denied",
        reason: "permission_not_granted",
        auditRequired: true,
      },
      {
        scenario: "approver_scope_denial",
        result: "denied",
        reason: "permission_not_granted",
        auditRequired: true,
      },
    ]);
  });

  it("summarizes approval readiness without exposing customer content", () => {
    const summary = summarizeR008ApprovalJourneyProbe(
      buildR008ApprovalJourneyProbe({
        actors: r008Actors,
        approvalItems: r008ScopedApprovalItems,
        currentClientId: r008SyntheticClientA.id,
        comparisonClientId: r008SyntheticClientB.id,
      }),
    );

    expect(summary).toEqual({
      scenarioCount: 4,
      allowedCount: 1,
      deniedCount: 3,
      auditRequiredForAll: true,
      staleVersionDenied: true,
      viewerDenied: true,
      approverScopeDenied: true,
      currentVersionApprovalAllowed: true,
      customerDataExposed: false,
    });
  });
});
