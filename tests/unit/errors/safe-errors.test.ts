import { describe, expect, it } from "vitest";
import { SAFE_ERROR_COPY, mapSafeError } from "@/modules/errors/safe-errors";

describe("safe authorization errors", () => {
  it("maps unauthorized resource access to generic denial copy", () => {
    const error = mapSafeError({
      code: "ACCESS_DENIED",
      exposeResource: false,
      internalReason: "Tenant B exists but actor is Tenant A only",
    });

    expect(error).toEqual({
      code: "ACCESS_DENIED",
      status: 404,
      copyKey: "errors.permissionDenied",
    });
    expect(JSON.stringify(error)).not.toContain("Tenant B");
  });

  it("does not expose raw database or auth messages", () => {
    const error = mapSafeError({
      code: "ACCESS_DENIED",
      exposeResource: false,
      internalReason: 'permission denied for table "tenant_memberships"',
    });

    expect(JSON.stringify(error)).not.toContain("tenant_memberships");
    expect(SAFE_ERROR_COPY["errors.permissionDenied"]).toBeTruthy();
  });
});
