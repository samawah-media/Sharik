import { describe, expect, it } from "vitest";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import {
  PERMISSIONS,
  roleGrantsPermission,
} from "@/modules/authorization/permission-catalog";
import type { RoleKey } from "@/modules/memberships/membership";
import { classifyR008PersonaScope } from "@/modules/authorization/r008-persona-scope";
import { validateRoleAssignmentAuthority } from "@/modules/roles/role-assignment-rules";
import {
  assignedInternalA,
  clientA,
  clientC,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";
const actor = {
  ...assignedInternalA.authorizationActor,
  roleAssignments: assignedInternalA.authorizationActor.roleAssignments.map(
    (a) => ({ ...a, roleKey: "project_manager" as RoleKey }),
  ),
};
describe("client-scoped project manager", () => {
  it.each([
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CONTRACT_VIEW,
    PERMISSIONS.LEDGER_VIEW_SUMMARY,
    PERMISSIONS.DELIVERABLE_CREATE,
    PERMISSIONS.DELIVERABLE_CANCEL_NOT_STARTED,
    PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    PERMISSIONS.DELIVERABLE_VERSION_SUBMIT,
    PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
    PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
  ])("grants %s only in assigned client", (permission) => {
    expect(
      evaluatePermission({
        actor,
        permission,
        resource: { tenantId: actor.tenantId, clientId: clientA.id },
      }).allowed,
    ).toBe(true);
    expect(
      evaluatePermission({
        actor,
        permission,
        resource: { tenantId: actor.tenantId, clientId: clientC.id },
      }).allowed,
    ).toBe(false);
  });
  it.each([
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.USER_ROLE_UPDATE,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.PACKAGE_CREATE,
    PERMISSIONS.PACKAGE_ADJUST,
    PERMISSIONS.DELIVERABLE_EXTRA_CREATE,
    PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
  ])("denies %s", (permission) => {
    expect(
      evaluatePermission({
        actor,
        permission,
        resource: { tenantId: actor.tenantId, clientId: clientA.id },
      }).allowed,
    ).toBe(false);
  });
  it.each(["future_role", "toString", "__proto__"])(
    "fails closed for unknown database role %s",
    (role) => {
      expect(
        roleGrantsPermission(role as RoleKey, PERMISSIONS.CLIENT_VIEW),
      ).toBe(false);
    },
  );
  it("classifies PM as internal without broad client discovery", () => {
    expect(
      classifyR008PersonaScope({
        actor,
        tenantId: actor.tenantId,
        clientIds: [clientA.id, clientC.id],
      }),
    ).toMatchObject({
      persona: "assigned_internal_user",
      visibleClientIds: [clientA.id],
      deniedClientIds: [clientC.id],
      canViewAllTenantClients: false,
    });
  });
  it.each(["client", "tenant"] as const)(
    "admin can assign PM only at client scope: %s",
    (scopeType) => {
      expect(
        validateRoleAssignmentAuthority({
          actor: tenantAdminA.authorizationActor,
          targetMembership: actor.tenantMembership,
          membershipKind: "tenant",
          roleKey: "project_manager" as RoleKey,
          scopeType,
          scopeId: scopeType === "client" ? clientA.id : actor.tenantId,
        }).allowed,
      ).toBe(scopeType === "client");
    },
  );
});
