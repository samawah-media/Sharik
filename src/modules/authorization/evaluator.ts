import type { PermissionId } from "./permission-catalog";
import { roleGrantsPermission } from "./permission-catalog";
import { isActive, type RoleAssignment, type TenantMembership } from "../memberships/membership";

export type AuthorizationActor = {
  userId: string;
  tenantId: string;
  tenantMembership: TenantMembership;
  roleAssignments: RoleAssignment[];
};

export type ResourceScope = {
  tenantId: string;
  clientId?: string;
};

export type PermissionDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "membership_inactive"
        | "permission_not_granted"
        | "scope_mismatch";
    };

export const evaluatePermission = ({
  actor,
  permission,
  resource,
}: {
  actor: AuthorizationActor;
  permission: PermissionId;
  resource: ResourceScope;
}): PermissionDecision => {
  if (!isActive(actor.tenantMembership.status)) {
    return { allowed: false, reason: "membership_inactive" };
  }

  if (actor.tenantId !== resource.tenantId) {
    return { allowed: false, reason: "scope_mismatch" };
  }

  const activeAssignments = actor.roleAssignments.filter((assignment) => {
    if (!isActive(assignment.status)) {
      return false;
    }

    if (assignment.tenantId !== actor.tenantId) {
      return false;
    }

    if (!roleGrantsPermission(assignment.roleKey, permission)) {
      return false;
    }

    if (assignment.scopeType === "tenant") {
      return assignment.scopeId === resource.tenantId;
    }

    return Boolean(resource.clientId) && assignment.scopeId === resource.clientId;
  });

  return activeAssignments.length > 0
    ? { allowed: true }
    : { allowed: false, reason: "permission_not_granted" };
};
