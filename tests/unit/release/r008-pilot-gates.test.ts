import { describe, expect, it } from "vitest";
import {
  R008_PILOT_GATE_AREAS,
  buildR008InternalGateReview,
  classifyR008PilotAction,
} from "@/modules/release/r008-pilot-gates";

describe("R-008 pilot gates", () => {
  it("maps the local review surface to owner-controlled gate areas", () => {
    expect(R008_PILOT_GATE_AREAS).toEqual([
      "r007_readiness_boundary",
      "local_owner_controlled_hardening",
      "tenant_client_isolation_proof",
      "hosted_database_mutation",
      "deploy_or_promote",
      "non_hadna_data",
      "production_candidate_review",
      "production_acceptance",
    ]);

    const review = buildR008InternalGateReview();
    expect(review.productionAcceptanceGranted).toBe(false);
    expect(review.blockedGateCount).toBeGreaterThanOrEqual(5);
    expect(review.gates.map((gate) => gate.area)).toEqual([
      ...R008_PILOT_GATE_AREAS,
    ]);
  });

  it("allows local-only hardening that preserves R-006 and R-007 boundaries", () => {
    expect(
      classifyR008PilotAction({
        action: "phase_3_4_local_hardening",
        localOnly: true,
        dataBoundary: "synthetic_or_hadna_authorized",
        preservesR006AcceptedInternalUat: true,
        preservesR007ReadinessOnly: true,
      }),
    ).toMatchObject({
      allowed: true,
      status: "allowed",
      reasons: [
        "local_only_within_r008_boundary",
        "r006_internal_uat_acceptance_preserved",
        "r007_readiness_only_boundary_preserved",
      ],
      requiredOwnerApprovals: [],
    });
  });

  it("blocks hosted mutation, deploy or promote, non-Hadna data, and production-candidate claims without owner approval", () => {
    const decision = classifyR008PilotAction({
      action: "hosted_expansion_without_boundary",
      hostedDatabaseMutation: true,
      hostedDeployOrPromotion: true,
      nonHadnaCustomerData: true,
      productionCandidateReview: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("owner_approval_required");
    expect(decision.requiredOwnerApprovals).toEqual([
      "owner_approval_for_hosted_database_mutation",
      "owner_approval_for_deploy_or_promote",
      "owner_approval_for_non_hadna_customer_data",
      "owner_approval_for_production_candidate_review",
    ]);
    expect(decision.requiredEvidence).toEqual(
      expect.arrayContaining([
        "environment",
        "data_boundary",
        "rollback_plan",
        "duration",
        "evidence_rules",
      ]),
    );
  });

  it("keeps production acceptance as a separate explicit owner decision", () => {
    const decision = classifyR008PilotAction({
      action: "production_acceptance",
      productionAcceptance: true,
      ownerApprovalRecorded: true,
      productionAcceptanceExplicitlyGranted: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("separate_production_acceptance_required");
    expect(decision.requiredOwnerApprovals).toContain(
      "separate_explicit_production_acceptance_owner_decision",
    );
    expect(decision.reasons).toContain("r008_completion_is_not_production_acceptance");
  });
});
