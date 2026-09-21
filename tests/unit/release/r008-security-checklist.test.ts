import { describe, expect, it } from "vitest";
import {
  R008_SECURITY_CONTROL_AREAS,
  buildR008SecurityChecklist,
  summarizeR008SecurityChecklist,
} from "@/modules/release/r008-security-checklist";

describe("R-008 security checklist", () => {
  it("covers every production-candidate control area required by US3", () => {
    const checklist = buildR008SecurityChecklist();

    expect(checklist.items.map((item) => item.area)).toEqual([
      ...R008_SECURITY_CONTROL_AREAS,
    ]);
    expect(checklist.items).toHaveLength(11);
    expect(
      checklist.items.every(
        (item) =>
          item.control.length > 0 &&
          item.evidence.length > 0 &&
          item.safeEvidenceOnly,
      ),
    ).toBe(true);
  });

  it("keeps hosted UAT and Production acceptance blocked pending owner decisions", () => {
    const checklist = buildR008SecurityChecklist();
    const hosted = checklist.items.find(
      (item) => item.area === "hosted_uat_boundary",
    );
    const production = checklist.items.find(
      (item) => item.area === "production_acceptance_boundary",
    );

    expect(hosted).toMatchObject({
      status: "blocked",
      ownerDecisionNeeded: "owner_approval_for_hosted_uat_boundary",
    });
    expect(hosted?.blockers).toEqual(
      expect.arrayContaining(["hosted_database_mutation_blocked"]),
    );
    expect(production).toMatchObject({
      status: "blocked",
      ownerDecisionNeeded: "separate_production_acceptance_owner_decision",
    });
  });

  it("summarizes blockers and residual risks without granting production-candidate readiness", () => {
    const summary = summarizeR008SecurityChecklist(buildR008SecurityChecklist());

    expect(summary.failedCount).toBe(0);
    expect(summary.blockedCount).toBeGreaterThanOrEqual(2);
    expect(summary.productionCandidateReady).toBe(false);
    expect(summary.blockingAreas).toEqual(
      expect.arrayContaining([
        "hosted_uat_boundary",
        "production_acceptance_boundary",
      ]),
    );
    expect(summary.residualRiskCount).toBeGreaterThan(0);
  });
});
