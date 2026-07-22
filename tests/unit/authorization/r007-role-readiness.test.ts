import { describe, expect, it } from "vitest";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import {
  PERMISSIONS,
  roleGrantsPermission,
} from "@/modules/authorization/permission-catalog";
import type {
  RoleAssignment,
  RoleKey,
  TenantMembership,
} from "@/modules/memberships/membership";

const tenantId = "tenant_r007";
const clientAId = "client_r007_a";
const clientBId = "client_r007_b";

const membershipFor = (
  roleKey: RoleKey,
  status: TenantMembership["status"] = "active",
): TenantMembership => ({
  id: `membership_${roleKey}`,
  tenantId,
  userId: `user_${roleKey}`,
  status,
});

const assignmentFor = ({
  roleKey,
  membershipId,
  scopeType,
  scopeId,
  status = "active",
}: Pick<RoleAssignment, "roleKey" | "membershipId" | "scopeType" | "scopeId"> &
  Partial<Pick<RoleAssignment, "status">>): RoleAssignment => ({
  id: `role_${roleKey}_${scopeType}`,
  tenantId,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  status,
});

const actorFor = ({
  roleKey,
  scopeType,
  scopeId,
  membershipStatus = "active",
  assignmentStatus = "active",
}: {
  roleKey: RoleKey;
  scopeType: RoleAssignment["scopeType"];
  scopeId: string;
  membershipStatus?: TenantMembership["status"];
  assignmentStatus?: RoleAssignment["status"];
}): AuthorizationActor => {
  const tenantMembership = membershipFor(roleKey, membershipStatus);

  return {
    userId: tenantMembership.userId,
    tenantId,
    tenantMembership,
    roleAssignments: [
      assignmentFor({
        roleKey,
        membershipId: tenantMembership.id,
        scopeType,
        scopeId,
        status: assignmentStatus,
      }),
    ],
  };
};

const actorWithoutRoles = (): AuthorizationActor => {
  const tenantMembership: TenantMembership = {
    id: "membership_unassigned",
    tenantId,
    userId: "user_unassigned",
    status: "active",
  };

  return {
    userId: tenantMembership.userId,
    tenantId,
    tenantMembership,
    roleAssignments: [],
  };
};

describe("R-007 role readiness matrix", () => {
  it("keeps internal approval and send-to-client powers management-only", () => {
    const managementRoles: RoleKey[] = ["tenant_owner", "tenant_administrator"];
    const nonManagementRoles: RoleKey[] = [
      "account_manager",
      "content_writer",
      "designer",
      "client_admin",
      "client_approver",
      "client_viewer",
    ];

    for (const roleKey of managementRoles) {
      expect(
        roleGrantsPermission(
          roleKey,
          PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
        ),
      ).toBe(true);
      expect(
        roleGrantsPermission(roleKey, PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT),
      ).toBe(true);
    }

    for (const roleKey of nonManagementRoles) {
      expect(
        roleGrantsPermission(
          roleKey,
          PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
        ),
      ).toBe(false);
      expect(
        roleGrantsPermission(roleKey, PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT),
      ).toBe(false);
    }
  });

  it("allows assigned internal workflow updates without granting approval powers", () => {
    const accountManager = actorFor({
      roleKey: "account_manager",
      scopeType: "client",
      scopeId: clientAId,
    });

    expect(
      evaluatePermission({
        actor: accountManager,
        permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({ allowed: true });

    for (const permission of [
      PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
      PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
      PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
    ]) {
      expect(
        evaluatePermission({
          actor: accountManager,
          permission,
          resource: { tenantId, clientId: clientAId },
        }),
      ).toEqual({
        allowed: false,
        reason: "permission_not_granted",
      });
    }

    expect(
      evaluatePermission({
        actor: accountManager,
        permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
        resource: { tenantId, clientId: clientBId },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });
  });

  it("keeps client approver actions scoped and client viewer access read-only", () => {
    const clientApprover = actorFor({
      roleKey: "client_approver",
      scopeType: "client",
      scopeId: clientAId,
    });
    const clientViewer = actorFor({
      roleKey: "client_viewer",
      scopeType: "client",
      scopeId: clientAId,
    });

    expect(
      evaluatePermission({
        actor: clientApprover,
        permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluatePermission({
        actor: clientApprover,
        permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
        resource: { tenantId, clientId: clientBId },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });
    expect(
      evaluatePermission({
        actor: clientApprover,
        permission: PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });

    expect(
      evaluatePermission({
        actor: clientViewer,
        permission: PERMISSIONS.LEDGER_VIEW_SUMMARY,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluatePermission({
        actor: clientViewer,
        permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });
  });

  it("denies unassigned or inactive actors before release evidence can be accepted", () => {
    expect(
      evaluatePermission({
        actor: actorWithoutRoles(),
        permission: PERMISSIONS.CLIENT_VIEW,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });

    expect(
      evaluatePermission({
        actor: actorFor({
          roleKey: "client_approver",
          scopeType: "client",
          scopeId: clientAId,
          membershipStatus: "disabled",
        }),
        permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
        resource: { tenantId, clientId: clientAId },
      }),
    ).toEqual({
      allowed: false,
      reason: "membership_inactive",
    });
  });
});
