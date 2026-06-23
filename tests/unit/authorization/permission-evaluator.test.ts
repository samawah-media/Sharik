import { describe, expect, it } from "vitest";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  clientA,
  clientB,
  disabledTenantMember,
  tenantA,
  tenantAdminA,
  tenantViewerA,
} from "../../fixtures/f001-fixtures";

describe("permission evaluator", () => {
  it("denies by default when no role grants the requested permission", () => {
    const result = evaluatePermission({
      actor: tenantViewerA.authorizationActor,
      permission: PERMISSIONS.CLIENT_CREATE,
      resource: { tenantId: tenantA.id },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "permission_not_granted",
    });
  });

  it("allows a granted tenant-scoped permission in the actor tenant", () => {
    const result = evaluatePermission({
      actor: tenantAdminA.authorizationActor,
      permission: PERMISSIONS.CLIENT_CREATE,
      resource: { tenantId: tenantA.id },
    });

    expect(result).toMatchObject({ allowed: true });
  });

  it("denies when the resource tenant does not match the trusted tenant context", () => {
    const result = evaluatePermission({
      actor: tenantAdminA.authorizationActor,
      permission: PERMISSIONS.CLIENT_VIEW,
      resource: { tenantId: clientB.tenantId, clientId: clientB.id },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "scope_mismatch",
    });
  });

  it("denies client-scoped access outside an assigned client", () => {
    const result = evaluatePermission({
      actor: tenantViewerA.authorizationActor,
      permission: PERMISSIONS.CLIENT_VIEW,
      resource: { tenantId: tenantA.id, clientId: clientA.id },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "permission_not_granted",
    });
  });

  it("denies disabled membership even if a stale role assignment remains", () => {
    const result = evaluatePermission({
      actor: disabledTenantMember.authorizationActor,
      permission: PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT,
      resource: { tenantId: tenantA.id },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "membership_inactive",
    });
  });
});
