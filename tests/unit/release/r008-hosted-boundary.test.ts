import { describe, expect, it } from "vitest";
import {
  R008_REQUIRED_HOSTED_OWNER_FIELDS,
  classifyR008HostedBoundary,
} from "@/modules/release/r008-hosted-boundary";

describe("R-008 hosted boundary classifier", () => {
  it("treats local-only hardening as allowed without hosted approval fields", () => {
    expect(
      classifyR008HostedBoundary({
        action: "local_isolation_proof",
        localOnly: true,
      }),
    ).toMatchObject({
      allowed: true,
      status: "local_only_allowed",
      missingOwnerFields: [],
    });
  });

  it("requires an explicit owner boundary before hosted read-only UAT", () => {
    const decision = classifyR008HostedBoundary({
      action: "hosted_read_only_smoke",
      hostedReadOnlyUat: true,
      ownerApproval: {
        environment: "uat",
        dataBoundary: "hadna_authorized_only",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("owner_boundary_incomplete");
    expect(decision.missingOwnerFields).toEqual([
      "read_only_or_mutation_scope",
      "rollback_plan",
      "duration",
      "evidence_rules",
    ]);
  });

  it("blocks hosted mutation until every required owner field is present", () => {
    const decision = classifyR008HostedBoundary({
      action: "hosted_mutation",
      hostedDatabaseMutation: true,
      ownerApproval: {
        environment: "uat",
        dataBoundary: "hadna_authorized_only",
        readOnlyOrMutationScope: "named_mutation_plan",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe("owner_boundary_incomplete");
    expect(decision.requiredOwnerFields).toEqual([
      ...R008_REQUIRED_HOSTED_OWNER_FIELDS,
    ]);
    expect(decision.missingOwnerFields).toEqual([
      "rollback_plan",
      "duration",
      "evidence_rules",
    ]);
  });

  it("classifies a complete future read-only hosted boundary without granting mutation or production acceptance", () => {
    const decision = classifyR008HostedBoundary({
      action: "future_read_only_uat",
      hostedReadOnlyUat: true,
      ownerApproval: {
        environment: "uat",
        dataBoundary: "hadna_authorized_only",
        readOnlyOrMutationScope: "read_only_smoke",
        rollbackPlan: "hosted_read_only_recovery",
        duration: "bounded_window",
        evidenceRules: "safe_summaries_only",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe("owner_boundary_complete");
    expect(decision.productionAcceptanceGranted).toBe(false);
    expect(decision.mutationAllowed).toBe(false);
  });
});
