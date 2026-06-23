import { describe, expect, it } from "vitest";
import { tenantA, tenantAdminA, tenantB } from "../../fixtures/f001-fixtures";

describe("F-001A test fixtures", () => {
  it("keeps Tenant A and Tenant B isolated in fixture data", () => {
    expect(tenantA.id).not.toBe(tenantB.id);
    expect(tenantAdminA.tenantMemberships).toHaveLength(1);
    expect(tenantAdminA.tenantMemberships[0]?.tenantId).toBe(tenantA.id);
  });
});
