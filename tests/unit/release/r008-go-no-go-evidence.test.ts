import { describe, expect, it } from "vitest";
import {
  R008_GO_NO_GO_DECISION_OPTIONS,
  buildR008GoNoGoDecisionOptions,
  buildR008GoNoGoSummary,
} from "@/modules/release/r008-go-no-go-summary";

describe("R-008 go/no-go evidence package", () => {
  it("summarizes completed local evidence without granting hosted or Production authority", () => {
    const summary = buildR008GoNoGoSummary({
      phase8VerificationStatus: "passed",
    });

    expect(summary.status).toBe("ready_for_owner_go_no_go_review");
    expect(summary.safeEvidenceOnly).toBe(true);
    expect(summary.productionAcceptanceGranted).toBe(false);
    expect(summary.hostedMutationAuthorized).toBe(false);
    expect(summary.deployOrPromoteAuthorized).toBe(false);
    expect(summary.nonHadnaDataAuthorized).toBe(false);
    expect(summary.rollbackReady).toBe(true);
    expect(summary.passedEvidence).toEqual(
      expect.arrayContaining([
        "controlled_pilot_execution_gates",
        "tenant_client_isolation_proof",
        "production_candidate_security_checklist",
        "client_approval_current_version_probe",
        "audit_completeness_matrix",
        "sla_reporting_readiness",
      ]),
    );
    expect(summary.blockedScope).toEqual(
      expect.arrayContaining([
        "hosted_database_mutation",
        "deploy_or_promote",
        "non_hadna_customer_data",
        "production_acceptance",
      ]),
    );
  });

  it("keeps the package blocked until Phase 8 verification is complete", () => {
    expect(buildR008GoNoGoSummary().status).toBe(
      "blocked_for_final_verification",
    );
    expect(
      buildR008GoNoGoSummary({ phase8VerificationStatus: "failed" }).status,
    ).toBe("blocked_for_fixes");
  });

  it("offers the exact final owner decision options", () => {
    const options = buildR008GoNoGoDecisionOptions();

    expect(options.map((option) => option.id)).toEqual([
      ...R008_GO_NO_GO_DECISION_OPTIONS,
    ]);
    expect(options.map((option) => option.label)).toEqual([
      "accept R-008 local readiness only",
      "request fixes",
      "authorize limited hosted read-only UAT",
      "authorize limited hosted UAT mutation with named environment/data/rollback/duration/evidence",
      "start separate production-candidate package",
    ]);
    expect(
      options.every((option) => option.grantsProductionAcceptance === false),
    ).toBe(true);
    expect(
      options.find(
        (option) => option.id === "authorize_limited_hosted_uat_mutation",
      )?.requiredOwnerFields,
    ).toEqual([
      "environment",
      "data_boundary",
      "read_only_or_mutation_scope",
      "rollback_plan",
      "duration",
      "evidence_rules",
    ]);
  });
});
