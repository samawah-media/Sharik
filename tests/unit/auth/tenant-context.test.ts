import { describe, expect, it } from "vitest";
import { resolveTenantContext } from "@/modules/auth/tenant-context";
import {
  actorWithoutMembership,
  disabledTenantMember,
  tenantA,
  tenantB,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

describe("tenant context resolver", () => {
  it("denies an unauthenticated user", () => {
    const result = resolveTenantContext({
      session: null,
      memberships: [],
      targetTenantId: tenantA.id,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "AUTH_REQUIRED", exposeResource: false },
    });
  });

  it("denies an authenticated user without active tenant membership", () => {
    const result = resolveTenantContext({
      session: actorWithoutMembership.session,
      memberships: [],
      targetTenantId: tenantA.id,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });
  });

  it("denies cross-tenant targets without revealing the target tenant", () => {
    const result = resolveTenantContext({
      session: tenantAdminA.session,
      memberships: tenantAdminA.tenantMemberships,
      targetTenantId: tenantB.id,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACCESS_DENIED", exposeResource: false },
    });
  });

  it("does not trust a browser supplied tenant id when deriving context", () => {
    const result = resolveTenantContext({
      session: tenantAdminA.session,
      memberships: tenantAdminA.tenantMemberships,
      browserTenantId: tenantB.id,
      targetTenantId: tenantA.id,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { tenantId: tenantA.id, source: "membership" },
    });
  });

  it("denies disabled memberships even when the session is still active", () => {
    const result = resolveTenantContext({
      session: disabledTenantMember.session,
      memberships: disabledTenantMember.tenantMemberships,
      targetTenantId: tenantA.id,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "MEMBERSHIP_DISABLED", exposeResource: false },
    });
  });
});
