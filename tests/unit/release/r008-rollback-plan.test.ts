import { describe, expect, it } from "vitest";
import {
  R008_ROLLBACK_AREAS,
  buildR008RollbackPlan,
  evaluateR008HostedRollbackReadiness,
  validateR008RollbackPlan,
} from "@/modules/release/r008-rollback-plan";

describe("R-008 rollback plan", () => {
  it("covers code, hosted state, data, files, permissions, communication, and verification", () => {
    const plan = buildR008RollbackPlan();

    expect(plan.items.map((item) => item.area)).toEqual([
      ...R008_ROLLBACK_AREAS,
    ]);
    expect(
      plan.items.every(
        (item) =>
          item.trigger.length > 0 &&
          item.owner.length > 0 &&
          item.steps.length > 0 &&
          item.verification.length > 0,
      ),
    ).toBe(true);
  });

  it("validates that rollback is explicit before any hosted UAT path", () => {
    const plan = buildR008RollbackPlan();

    expect(validateR008RollbackPlan(plan)).toEqual({
      complete: true,
      missingAreas: [],
      incompleteAreas: [],
    });
    expect(
      evaluateR008HostedRollbackReadiness({
        plan,
        ownerApprovalRecorded: false,
      }),
    ).toEqual({
      allowed: false,
      reason: "owner_approval_required_before_hosted_action",
      rollbackComplete: true,
    });
  });

  it("blocks hosted readiness when a rollback area is incomplete", () => {
    const plan = buildR008RollbackPlan();
    const incomplete = {
      ...plan,
      items: plan.items.map((item) =>
        item.area === "file_visibility"
          ? { ...item, steps: [] }
          : item,
      ),
    };

    expect(validateR008RollbackPlan(incomplete)).toMatchObject({
      complete: false,
      incompleteAreas: ["file_visibility"],
    });
    expect(
      evaluateR008HostedRollbackReadiness({
        plan: incomplete,
        ownerApprovalRecorded: true,
      }),
    ).toEqual({
      allowed: false,
      reason: "rollback_plan_incomplete",
      rollbackComplete: false,
    });
  });
});
