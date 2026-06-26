import { describe, expect, it } from "vitest";
import { deriveRuntimeActor } from "@/server/auth/runtime-context";

describe("runtime auth context", () => {
  it("derives an authorization actor from verified claims and database rows", () => {
    const result = deriveRuntimeActor({
      claims: {
        sub: "30000000-0000-4000-8000-000000000002",
        email: "tenant-admin@preview.example.test",
      },
      tenantMemberships: [
        {
          id: "40000000-0000-4000-8000-000000000002",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          auth_user_id: "30000000-0000-4000-8000-000000000002",
          status: "active",
        },
      ],
      clientMemberships: [],
      roleAssignments: [
        {
          id: "60000000-0000-4000-8000-000000000002",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          membership_id: "40000000-0000-4000-8000-000000000002",
          role_key: "tenant_administrator",
          scope_type: "tenant",
          scope_id: "10000000-0000-4000-8000-000000000001",
          status: "active",
        },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      actor: {
        userId: "30000000-0000-4000-8000-000000000002",
        tenantId: "10000000-0000-4000-8000-000000000001",
        tenantMembership: {
          status: "active",
        },
        roleAssignments: [
          {
            roleKey: "tenant_administrator",
            scopeType: "tenant",
          },
        ],
      },
    });
  });

  it("denies stale sessions when the database membership is disabled", () => {
    const result = deriveRuntimeActor({
      claims: {
        sub: "30000000-0000-4000-8000-000000000099",
        email: "disabled@preview.example.test",
      },
      tenantMemberships: [
        {
          id: "40000000-0000-4000-8000-000000000099",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          auth_user_id: "30000000-0000-4000-8000-000000000099",
          status: "disabled",
        },
      ],
      clientMemberships: [],
      roleAssignments: [
        {
          id: "60000000-0000-4000-8000-000000000099",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          membership_id: "40000000-0000-4000-8000-000000000099",
          role_key: "tenant_administrator",
          scope_type: "tenant",
          scope_id: "10000000-0000-4000-8000-000000000001",
          status: "active",
        },
      ],
    });

    expect(result).toEqual({ ok: false, reason: "membership_disabled" });
  });

  it("denies by default when no tenant membership row exists", () => {
    const result = deriveRuntimeActor({
      claims: {
        sub: "30000000-0000-4000-8000-000000000010",
        email: "orphan@preview.example.test",
      },
      tenantMemberships: [],
      clientMemberships: [],
      roleAssignments: [],
    });

    expect(result).toEqual({ ok: false, reason: "access_denied" });
  });

  it("fails closed when membership status is unexpected", () => {
    const result = deriveRuntimeActor({
      claims: {
        sub: "30000000-0000-4000-8000-000000000011",
        email: "unexpected-status@preview.example.test",
      },
      tenantMemberships: [
        {
          id: "40000000-0000-4000-8000-000000000011",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          auth_user_id: "30000000-0000-4000-8000-000000000011",
          status: "enabled",
        },
      ],
      clientMemberships: [],
      roleAssignments: [],
    });

    expect(result).toEqual({ ok: false, reason: "membership_disabled" });
  });

  it("fails closed when a session has multiple active tenant memberships", () => {
    const result = deriveRuntimeActor({
      claims: {
        sub: "30000000-0000-4000-8000-000000000012",
        email: "multi-tenant@preview.example.test",
      },
      tenantMemberships: [
        {
          id: "40000000-0000-4000-8000-000000000012",
          tenant_id: "10000000-0000-4000-8000-000000000001",
          auth_user_id: "30000000-0000-4000-8000-000000000012",
          status: "active",
        },
        {
          id: "40000000-0000-4000-8000-000000000013",
          tenant_id: "10000000-0000-4000-8000-000000000002",
          auth_user_id: "30000000-0000-4000-8000-000000000012",
          status: "active",
        },
      ],
      clientMemberships: [],
      roleAssignments: [],
    });

    expect(result).toEqual({ ok: false, reason: "access_denied" });
  });
});
