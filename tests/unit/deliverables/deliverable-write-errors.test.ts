import { describe, expect, it } from "vitest";
import {
  asDeliverableWriteError,
  capacityFailureMessage,
  duplicateFailureMessage,
  invalidContributorFailureMessage,
  invalidIdentifierFailureMessage,
  invalidOwnerFailureMessage,
  mapDeliverableWriteError,
  permissionFailureMessage,
  saveFailureMessage,
  validateDeliverableIdentifierFields,
  validationFailureMessage,
} from "@/server/actions/deliverable-write-errors";
import {
  createApprovedExtraDeliverableSchema,
  createDeliverableSchema,
} from "@/server/commands/deliverables/deliverable-schemas";

const VALID_UUID_A = "00000000-0000-4000-8000-000000000001";
const VALID_UUID_B = "00000000-0000-4000-8000-000000000002";

const validBaseDeliverableFields = {
  clientId: "client_a",
  name: "منشور هدنة للاختبار",
  description: "وصف قصير",
  type: "post",
  priority: "normal" as const,
  ownerUserId: undefined,
  contributorUserIds: [] as string[],
  startDate: undefined,
  internalDueDate: undefined,
  clientDueDate: undefined,
  finalDueDate: undefined,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  idempotencyKey: "x009-repro-aaaaaaaa",
};

describe("validateDeliverableIdentifierFields", () => {
  it("accepts empty owner and empty contributor list", () => {
    expect(
      validateDeliverableIdentifierFields({
        ownerUserId: undefined,
        contributorUserIds: [],
      }),
    ).toBeNull();
  });

  it("accepts valid UUID owner and contributor identifiers", () => {
    expect(
      validateDeliverableIdentifierFields({
        ownerUserId: VALID_UUID_A,
        contributorUserIds: [VALID_UUID_B],
      }),
    ).toBeNull();
  });

  it("rejects a non-UUID owner (e.g. user-typed name) with the actionable Arabic owner message", () => {
    expect(
      validateDeliverableIdentifierFields({
        ownerUserId: "أحمد",
        contributorUserIds: [],
      }),
    ).toBe(invalidOwnerFailureMessage);
  });

  it("rejects a non-UUID contributor id with the actionable Arabic contributor message", () => {
    expect(
      validateDeliverableIdentifierFields({
        ownerUserId: undefined,
        contributorUserIds: [VALID_UUID_A, "not-a-uuid"],
      }),
    ).toBe(invalidContributorFailureMessage);
  });

  it("ignores empty strings produced by trailing commas in the contributors input", () => {
    expect(
      validateDeliverableIdentifierFields({
        ownerUserId: undefined,
        contributorUserIds: [VALID_UUID_A, ""],
      }),
    ).toBeNull();
  });
});

describe("mapDeliverableWriteError", () => {
  it("maps 23505 to the duplicate idempotency message", () => {
    expect(mapDeliverableWriteError({ code: "23505" })).toBe(
      duplicateFailureMessage,
    );
  });

  it("maps 42501 with 'insufficient package capacity' to the capacity message", () => {
    expect(
      mapDeliverableWriteError({
        code: "42501",
        message: "insufficient package capacity",
      }),
    ).toBe(capacityFailureMessage);
  });

  it("maps a generic 42501 to the permission message", () => {
    expect(mapDeliverableWriteError({ code: "42501", message: "not authorized" })).toBe(
      permissionFailureMessage,
    );
  });

  it("maps P0001 to the validation message", () => {
    expect(mapDeliverableWriteError({ code: "P0001" })).toBe(
      validationFailureMessage,
    );
  });

  it("maps 22P02 (invalid uuid cast) to the actionable identifier message and never echoes the raw Postgres text", () => {
    const mapped = mapDeliverableWriteError({
      code: "22P02",
      message: 'invalid input syntax for type uuid: "أحمد"',
    });
    expect(mapped).toBe(invalidIdentifierFailureMessage);
    expect(mapped).not.toContain("أحمد");
    expect(mapped).not.toContain("invalid input syntax");
  });

  it("maps FK/NOT NULL/CHECK constraint codes to the validation message without leaking Postgres details", () => {
    for (const code of ["23502", "23503", "23514"] as const) {
      const mapped = mapDeliverableWriteError({
        code,
        message: `internal detail for ${code}`,
      });
      expect(mapped).toBe(validationFailureMessage);
      expect(mapped).not.toContain(code);
    }
  });

  it("falls back to the safe save failure message for unknown codes or network errors without a code", () => {
    expect(mapDeliverableWriteError({ code: "PGRST116" })).toBe(saveFailureMessage);
    expect(mapDeliverableWriteError({})).toBe(saveFailureMessage);
    expect(mapDeliverableWriteError({ code: undefined })).toBe(saveFailureMessage);
  });
});

describe("asDeliverableWriteError", () => {
  it("normalizes a PostgrestError-shaped object and drops non-string fields", () => {
    expect(
      asDeliverableWriteError({ code: "22P02", message: "invalid uuid" }),
    ).toEqual({ code: "22P02", message: "invalid uuid" });
  });

  it("returns an empty object for null/undefined so mapDeliverableWriteError stays on the safe fallback", () => {
    expect(asDeliverableWriteError(null)).toEqual({});
    expect(asDeliverableWriteError(undefined)).toEqual({});
  });
});

describe("createDeliverableSchema form validation", () => {
  const baseValidInput = {
    ...validBaseDeliverableFields,
    contractId: "contract_a",
    packageId: "package_a",
    packageLineId: "package_line_posts_a",
    reservedQuantity: 1,
  };

  it("accepts a minimal valid deliverable form payload", () => {
    const parsed = createDeliverableSchema.safeParse(baseValidInput);
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty deliverable name with a clear validation failure", () => {
    const parsed = createDeliverableSchema.safeParse({
      ...baseValidInput,
      name: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects out-of-order dates before they reach the RPC", () => {
    const parsed = createDeliverableSchema.safeParse({
      ...baseValidInput,
      startDate: "2026-07-10",
      internalDueDate: "2026-07-05",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a reserved quantity below 1", () => {
    const parsed = createDeliverableSchema.safeParse({
      ...baseValidInput,
      reservedQuantity: 0,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("createApprovedExtraDeliverableSchema form validation", () => {
  const baseExtraInput = {
    ...validBaseDeliverableFields,
    extraReason: "اعتماد إداري مكتوب من العميل",
    idempotencyKey: "x009-extra-aaaaaaaa",
  };

  it("accepts a valid approved extra payload", () => {
    const parsed = createApprovedExtraDeliverableSchema.safeParse(baseExtraInput);
    expect(parsed.success).toBe(true);
  });

  it("rejects an approved extra payload without a meaningful reason", () => {
    const parsed = createApprovedExtraDeliverableSchema.safeParse({
      ...baseExtraInput,
      extraReason: "x",
    });
    expect(parsed.success).toBe(false);
  });
});
