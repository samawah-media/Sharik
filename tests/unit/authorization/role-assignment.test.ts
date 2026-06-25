import { describe, expect, it } from "vitest";
import { validateRoleAssignmentAuthority } from "@/modules/roles/role-assignment-rules";
import {
  assignedInternalA,
  clientA,
  clientViewerA,
  tenantAdminA,
  tenantB,
} from "../../fixtures/f001-fixtures";

describe("role assignment authority", () => {
  it("allows tenant admin to assign multiple non-conflicting scoped roles", () => {
    const first = validateRoleAssignmentAuthority({
      actor: tenantAdminA.authorizationActor,
      targetMembership: tenantAdminA.tenantMemberships[0],
      membershipKind: "tenant",
      roleKey: "account_manager",
      scopeType: "client",
      scopeId: clientA.id,
    });
    const second = validateRoleAssignmentAuthority({
      actor: tenantAdminA.authorizationActor,
      targetMembership: tenantAdminA.tenantMemberships[0],
      membershipKind: "tenant",
      roleKey: "designer",
      scopeType: "client",
      scopeId: clientA.id,
    });

    expect(first).toEqual({ allowed: true });
    expect(second).toEqual({ allowed: true });
  });

  it("denies actor without role-update authority", () => {
    const decision = validateRoleAssignmentAuthority({
      actor: assignedInternalA.authorizationActor,
      targetMembership: assignedInternalA.tenantMemberships[0],
      membershipKind: "tenant",
      roleKey: "designer",
      scopeType: "client",
      scopeId: clientA.id,
    });

    expect(decision).toEqual({
      allowed: false,
      reason: "actor_not_authorized",
    });
  });

  it("denies client role outside the exact client membership scope", () => {
    const decision = validateRoleAssignmentAuthority({
      actor: tenantAdminA.authorizationActor,
      targetMembership: clientViewerA.clientMemberships[0],
      membershipKind: "client",
      roleKey: "client_approver",
      scopeType: "client",
      scopeId: "client_c",
    });

    expect(decision).toEqual({
      allowed: false,
      reason: "role_scope_mismatch",
    });
  });

  it("denies cross-tenant tenant scope", () => {
    const decision = validateRoleAssignmentAuthority({
      actor: tenantAdminA.authorizationActor,
      targetMembership: tenantAdminA.tenantMemberships[0],
      membershipKind: "tenant",
      roleKey: "tenant_administrator",
      scopeType: "tenant",
      scopeId: tenantB.id,
    });

    expect(decision).toEqual({
      allowed: false,
      reason: "scope_mismatch",
    });
  });
});
