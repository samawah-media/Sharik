import { describe, expect, it } from "vitest";
import {
  R007_BASELINE_BOUNDARY,
  R007_READINESS_AREAS,
  buildR007OwnerReadinessSummary,
  evaluateR007ReadinessBoundary,
} from "@/modules/release/r007-readiness-boundary";

describe("R-007 readiness boundary", () => {
  it("keeps R-006 as an accepted internal UAT baseline, not an open bugfix phase", () => {
    expect(R007_BASELINE_BOUNDARY.acceptedBaseline).toBe(
      "r006_hadna_internal_uat",
    );
    expect(R007_BASELINE_BOUNDARY.reopensR006BugfixPhase).toBe(false);
    expect(R007_BASELINE_BOUNDARY.productionAcceptanceGranted).toBe(false);
  });

  it("maps readiness to the full V1 core gate set", () => {
    expect(R007_READINESS_AREAS).toEqual([
      "deliverables",
      "sla",
      "approvals",
      "files",
      "permissions",
      "audit_logs",
      "client_portal",
      "release_evidence",
    ]);

    expect(buildR007OwnerReadinessSummary().gates).toHaveLength(
      R007_READINESS_AREAS.length,
    );
  });

  it("allows local fixture readiness work inside the R-007 boundary", () => {
    expect(
      evaluateR007ReadinessBoundary({
        activity: "local_fixture_readiness",
        usesOnlySafeLocalFixtures: true,
      }),
    ).toMatchObject({
      allowed: true,
      status: "allowed",
      reasons: ["within_r007_readiness_boundary"],
    });
  });

  it("blocks hosted mutation and non-Hadna data until owner approval and scope are recorded", () => {
    const decision = evaluateR007ReadinessBoundary({
      activity: "broader_pilot_trial",
      hostedDatabaseMutation: true,
      nonHadnaCustomerData: true,
      ownerApprovalRecorded: false,
      specKitScopeRecorded: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("owner_decision_required");
    expect(decision.requiredDecisions).toEqual([
      "owner_approval_for_hosted_database_mutation",
      "owner_approval_for_non_hadna_customer_data",
    ]);
  });

  it("keeps production acceptance out of R-007 readiness", () => {
    const decision = evaluateR007ReadinessBoundary({
      activity: "production_acceptance",
      productionAcceptance: true,
      ownerApprovalRecorded: true,
      specKitScopeRecorded: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("separate_production_decision_required");
    expect(decision.requiredDecisions).toContain(
      "separate_production_acceptance_owner_decision",
    );
  });

  it("requires ADR evidence for dependency or workflow semantics changes", () => {
    const decision = evaluateR007ReadinessBoundary({
      activity: "dependency_change",
      newDependency: true,
      approvalWorkflowChange: true,
      adrRecorded: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("adr_required");
    expect(decision.requiredEvidence).toEqual([
      "adr_for_new_dependency",
      "adr_for_approval_workflow_change",
    ]);
  });
});

