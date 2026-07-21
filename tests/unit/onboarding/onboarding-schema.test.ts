import { describe, expect, it } from "vitest";
import {
  onboardingSchema,
  parseOnboardingLinesJson,
} from "@/server/commands/onboarding/onboarding-schema";

const validBase = {
  runId: "onboard-test-run-001",
  clientName: "عميل جديد",
  clientContactName: "أحمد",
  clientContactEmail: "contact@example.test",
  contractName: "عقد التشغيل",
  contractReference: "CTR-001",
  contractSummary: "ملخص",
  contractPeriodStart: "2026-01-01",
  contractPeriodEnd: "2026-12-31",
  contractStatus: "active",
  packageName: "الباقة الشهرية",
  packagePeriodStart: "2026-01-01",
  packagePeriodEnd: "2026-12-31",
  packageStatus: "active",
  packageLines: [
    {
      serviceLabel: "منشورات",
      deliverableTypeHint: "post",
      unitLabel: "منشور",
      committedQuantity: 10,
    },
  ],
  deliverableName: "أول مخرج",
  deliverableDescription: "وصف",
  deliverableType: "post",
  deliverablePriority: "normal",
  ownerUserId: undefined,
  contributorUserIds: [],
  startDate: "2026-07-01",
  internalDueDate: "2026-07-10",
  clientDueDate: "2026-07-15",
  finalDueDate: "2026-07-20",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  reservedQuantity: 1,
};

describe("onboarding schema", () => {
  it("accepts a complete valid input", () => {
    const result = onboardingSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects a client name shorter than 2 characters", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      clientName: "ا",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty package lines array", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      packageLines: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects contract period start after end", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      contractPeriodStart: "2026-12-31",
      contractPeriodEnd: "2026-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("contract_period");
    }
  });

  it("rejects package period start after end", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      packagePeriodStart: "2026-12-31",
      packagePeriodEnd: "2026-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("package_period");
    }
  });

  it("rejects deliverable dates out of order", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      startDate: "2026-07-20",
      internalDueDate: "2026-07-10",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("dates_out_of_order");
    }
  });

  it("rejects reserved quantity exceeding first package line capacity", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      packageLines: [
        {
          serviceLabel: "منشورات",
          unitLabel: "منشور",
          committedQuantity: 3,
        },
      ],
      reservedQuantity: 5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("exceeds_package_capacity");
    }
  });

  it("accepts reserved quantity equal to first package line capacity", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      packageLines: [
        {
          serviceLabel: "منشورات",
          unitLabel: "منشور",
          committedQuantity: 5,
        },
      ],
      reservedQuantity: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      clientContactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional empty email", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      clientContactEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing runId", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      runId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 25 package lines", () => {
    const lines = Array.from({ length: 26 }, (_, i) => ({
      serviceLabel: `خدمة ${i}`,
      unitLabel: "وحدة",
      committedQuantity: 1,
    }));
    const result = onboardingSchema.safeParse({
      ...validBase,
      packageLines: lines,
    });
    expect(result.success).toBe(false);
  });
});

describe("parseOnboardingLinesJson", () => {
  it("parses a valid JSON array of lines", () => {
    const json = JSON.stringify([
      { serviceLabel: "منشورات", unitLabel: "منشور", committedQuantity: 5 },
    ]);
    const lines = parseOnboardingLinesJson(json);
    expect(lines).toHaveLength(1);
    expect(lines[0].serviceLabel).toBe("منشورات");
    expect(lines[0].committedQuantity).toBe(5);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseOnboardingLinesJson("not-json")).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(parseOnboardingLinesJson(undefined)).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    expect(parseOnboardingLinesJson('{"key":"value"}')).toEqual([]);
  });

  it("coerces committedQuantity to number", () => {
    const json = JSON.stringify([
      { serviceLabel: "خدمة", unitLabel: "وحدة", committedQuantity: "7" },
    ]);
    const lines = parseOnboardingLinesJson(json);
    expect(lines[0].committedQuantity).toBe(7);
  });
});
