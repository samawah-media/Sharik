import {
  isActive,
  type ClientMembership,
  type RoleAssignment,
  type TenantMembership,
} from "../memberships/membership";

export type RlsActor = {
  userId: string;
  tenantMemberships: TenantMembership[];
  clientMemberships?: ClientMembership[];
  roleAssignments?: RoleAssignment[];
};

export type TenantScopedRow = {
  tenantId: string;
  clientId?: string;
};

export type TenantSelectPolicy =
  | "tenant_member_select"
  | "own_membership_select"
  | "own_client_membership_select"
  | "role_assignment_select_by_tenant_member"
  | "audit_select_tenant_management"
  | "client_basics_select_authorized_scope"
  | "invitation_select_tenant_management";

export type TenantInsertPolicy =
  | "audit_insert_own_tenant"
  | "client_insert_tenant_management"
  | "invitation_insert_tenant_management";

const hasActiveTenantMembership = (actor: RlsActor, tenantId: string) =>
  actor.tenantMemberships.some(
    (membership) =>
      membership.userId === actor.userId &&
      membership.tenantId === tenantId &&
      isActive(membership.status),
  );

export const canSelectTenantScopedRow = ({
  actor,
  row,
  policy,
}: {
  actor: RlsActor;
  row: TenantScopedRow;
  policy: TenantSelectPolicy;
}) => {
  if (!hasActiveTenantMembership(actor, row.tenantId)) {
    return false;
  }

  const hasTenantManagement = actor.roleAssignments?.some(
    (assignment) =>
      assignment.tenantId === row.tenantId &&
      assignment.roleKey.match(/^tenant_(owner|administrator)$/) &&
      assignment.scopeType === "tenant" &&
      assignment.scopeId === row.tenantId &&
      isActive(assignment.status),
  );

  if (
    policy === "audit_select_tenant_management" ||
    policy === "invitation_select_tenant_management"
  ) {
    return Boolean(hasTenantManagement);
  }

  if (policy !== "client_basics_select_authorized_scope") {
    return true;
  }

  const hasClientRole = Boolean(row.clientId) &&
    actor.roleAssignments?.some(
      (assignment) =>
        assignment.tenantId === row.tenantId &&
        assignment.scopeType === "client" &&
        assignment.scopeId === row.clientId &&
        isActive(assignment.status),
    );

  const hasClientMembership = Boolean(row.clientId) &&
    actor.clientMemberships?.some(
      (membership) =>
        membership.userId === actor.userId &&
        membership.tenantId === row.tenantId &&
        membership.clientId === row.clientId &&
        isActive(membership.status),
    );

  return Boolean(hasTenantManagement || hasClientRole || hasClientMembership);
};

export const canInsertTenantScopedRow = ({
  actor,
  row,
  policy,
}: {
  actor: RlsActor;
  row: TenantScopedRow;
  policy: TenantInsertPolicy;
}) => {
  if (!hasActiveTenantMembership(actor, row.tenantId)) {
    return false;
  }

  if (policy === "audit_insert_own_tenant") {
    return true;
  }

  return Boolean(
    actor.roleAssignments?.some(
      (assignment) =>
        assignment.tenantId === row.tenantId &&
        assignment.roleKey.match(/^tenant_(owner|administrator)$/) &&
        assignment.scopeType === "tenant" &&
        assignment.scopeId === row.tenantId &&
        isActive(assignment.status),
    ),
  );
};
