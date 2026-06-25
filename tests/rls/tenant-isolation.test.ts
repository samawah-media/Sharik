import { describe, expect, it } from "vitest";
import {
  canInsertTenantScopedRow,
  canSelectTenantScopedRow,
} from "@/modules/rls/tenant-isolation-policy";
import { tenantA, tenantAdminA, tenantB } from "../fixtures/f001-fixtures";

describe("tenant isolation RLS foundation", () => {
  it.each([
    "tenant_member_select",
    "own_membership_select",
    "own_client_membership_select",
    "role_assignment_select_by_tenant_member",
  ] as const)("allows %s only inside an active tenant membership", (policy) => {
    expect(
      canSelectTenantScopedRow({
        actor: tenantAdminA.rlsActor,
        row: { tenantId: tenantA.id },
        policy,
      }),
    ).toBe(true);

    expect(
      canSelectTenantScopedRow({
        actor: tenantAdminA.rlsActor,
        row: { tenantId: tenantB.id },
        policy,
      }),
    ).toBe(false);
  });

  it("allows audit_select_tenant_management only for tenant management", () => {
    const actor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: tenantA.id },
        policy: "audit_select_tenant_management",
      }),
    ).toBe(true);

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: tenantB.id },
        policy: "audit_select_tenant_management",
      }),
    ).toBe(false);
  });

  it("denies cross-tenant audit writes even when the payload contains another tenant id", () => {
    expect(
      canInsertTenantScopedRow({
        actor: tenantAdminA.rlsActor,
        row: { tenantId: tenantB.id },
        policy: "audit_insert_own_tenant",
      }),
    ).toBe(false);
  });
});
