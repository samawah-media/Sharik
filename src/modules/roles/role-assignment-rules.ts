import { evaluatePermission, type AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  isActive,
  type MembershipKind,
  type RoleAssignment,
  type RoleKey,
  type ScopeType,
  type TenantMembership,
  type ClientMembership,
} from "@/modules/memberships/membership";

const tenantScopedRoles: readonly RoleKey[] = [
  "tenant_owner",
  "tenant_administrator",
];

const internalClientRoles: readonly RoleKey[] = [
  "account_manager",
  "content_writer",
  "designer",
];

const clientRoles: readonly RoleKey[] = [
  "client_admin",
  "client_approver",
  "client_viewer",
];

export type RoleAuthorityDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "actor_not_authorized"
        | "membership_inactive"
        | "role_scope_mismatch"
        | "scope_mismatch";
    };

export const validateRoleAssignmentAuthority = ({
  actor,
  targetMembership,
  membershipKind,
  roleKey,
  scopeType,
  scopeId,
}: {
  actor: AuthorizationActor;
  targetMembership: TenantMembership | ClientMembership;
  membershipKind: MembershipKind;
  roleKey: RoleKey;
  scopeType: ScopeType;
  scopeId: string;
}): RoleAuthorityDecision => {
  const permission = evaluatePermission({
    actor,
    permission: PERMISSIONS.USER_ROLE_UPDATE,
    resource: {
      tenantId: targetMembership.tenantId,
      clientId: scopeType === "client" ? scopeId : undefined,
    },
  });

  if (!permission.allowed) {
    return { allowed: false, reason: "actor_not_authorized" };
  }

  if (!isActive(targetMembership.status)) {
    return { allowed: false, reason: "membership_inactive" };
  }

  if (targetMembership.tenantId !== actor.tenantId) {
    return { allowed: false, reason: "scope_mismatch" };
  }

  if (scopeType === "tenant" && scopeId !== actor.tenantId) {
    return { allowed: false, reason: "scope_mismatch" };
  }

  if (membershipKind === "client") {
    const clientMembership = targetMembership as ClientMembership;

    if (
      scopeType !== "client" ||
      scopeId !== clientMembership.clientId ||
      !clientRoles.includes(roleKey)
    ) {
      return { allowed: false, reason: "role_scope_mismatch" };
    }

    return { allowed: true };
  }

  if (scopeType === "tenant") {
    return tenantScopedRoles.includes(roleKey)
      ? { allowed: true }
      : { allowed: false, reason: "role_scope_mismatch" };
  }

  return internalClientRoles.includes(roleKey)
    ? { allowed: true }
    : { allowed: false, reason: "role_scope_mismatch" };
};

export const hasActiveRoleConflict = ({
  assignments,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  excludingAssignmentId,
}: {
  assignments: RoleAssignment[];
  membershipId: string;
  roleKey: RoleKey;
  scopeType: ScopeType;
  scopeId: string;
  excludingAssignmentId?: string;
}) =>
  assignments.some(
    (assignment) =>
      assignment.id !== excludingAssignmentId &&
      assignment.membershipId === membershipId &&
      assignment.roleKey === roleKey &&
      assignment.scopeType === scopeType &&
      assignment.scopeId === scopeId &&
      assignment.status === "active",
  );
