import { describe, expect, it } from "vitest";
import {
  isHumanTrialContract,
  isHumanTrialDeliverable,
} from "@/modules/deliverables/human-trial-visibility";

describe("human trial visibility", () => {
  it("keeps workbook imports and normal records visible", () => {
    expect(isHumanTrialDeliverable({ import_run_id: "glass-season-4" })).toBe(
      true,
    );
    expect(
      isHumanTrialDeliverable({
        import_run_id: null,
        idempotency_key: "normal-record",
      }),
    ).toBe(true);
    expect(isHumanTrialContract({ reference: "GLASS-S4" })).toBe(true);
  });

  it("hides technical hosted lifecycle evidence from human product views", () => {
    expect(
      isHumanTrialDeliverable({
        import_run_id: "s015-hosted-lifecycle-0450b84082",
      }),
    ).toBe(false);
    expect(
      isHumanTrialDeliverable({
        idempotency_key: "s015-hosted-lifecycle-0450b84082-deliverable",
      }),
    ).toBe(false);
    expect(isHumanTrialContract({ reference: "S015-UAT-0450b84082" })).toBe(
      false,
    );
    expect(isHumanTrialDeliverable({ name: "Alpha negative-control" })).toBe(
      false,
    );
    expect(
      isHumanTrialDeliverable({
        name: "مخرج عادي",
        source_metadata: { category: "beta" },
      }),
    ).toBe(false);
  });
});
