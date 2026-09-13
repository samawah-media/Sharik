import { describe, expect, it } from "vitest";
import {
  buildR008OwnerDecisionEvidence,
  evaluateR008OwnerApprovalRecord,
} from "@/modules/release/r008-pilot-gates";

describe("R-008 owner decision evidence", () => {
  it("summarizes the current approved path as local-only hardening", () => {
    const evidence = buildR008OwnerDecisionEvidence();

    expect(evidence.currentApprovedPath).toBe("local_only_hardening");
    expect(evidence.productionAcceptanceGranted).toBe(false);
    expect(evidence.blockedBoundaries).toEqual([
      "hosted_database_mutation",
      "deploy_or_promote",
      "non_hadna_customer_data",
      "production_candidate_claim",
      "production_acceptance",
    ]);
    expect(evidence.safeEvidenceOnly).toBe(true);
  });

  it("accepts local-only owner approval records without hosted fields", () => {
    expect(
      evaluateR008OwnerApprovalRecord({
        requestedPath: "local_only_hardening",
        hostedDatabaseMutationAllowed: false,
        deployOrPromoteAllowed: false,
        nonHadnaCustomerDataAllowed: false,
        productionAcceptanceExplicit: false,
      }),
    ).toMatchObject({
      valid: true,
      missingFields: [],
      productionAcceptanceGranted: false,
    });
  });

  it("rejects hosted mutation approval records that omit rollback or evidence fields", () => {
    expect(
      evaluateR008OwnerApprovalRecord({
        requestedPath: "hosted_uat_mutation",
        hostedDatabaseMutationAllowed: true,
        deployOrPromoteAllowed: false,
        nonHadnaCustomerDataAllowed: false,
        productionAcceptanceExplicit: false,
        environment: "uat",
        dataBoundary: "hadna_authorized_only",
        readOnlyOrMutationScope: "named_mutation_plan",
      }),
    ).toMatchObject({
      valid: false,
      missingFields: ["rollbackPlan", "duration", "evidenceRules"],
      productionAcceptanceGranted: false,
    });
  });
});
