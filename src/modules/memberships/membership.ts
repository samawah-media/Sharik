export type MembershipStatus = "active" | "disabled" | "removed";
export type MembershipKind = "tenant" | "client";
export type RoleKey =
  | "tenant_owner"
  | "tenant_administrator"
  | "account_manager"
  | "content_writer"
  | "designer"
  | "client_admin"
  | "client_approver"
  | "client_viewer";

export type ScopeType = "tenant" | "client";

export type TenantMembership = {
  id: string;
  tenantId: string;
  userId: string;
  status: MembershipStatus;
};

export type ClientMembership = {
  id: string;
  tenantId: string;
  clientId: string;
  userId: string;
  status: MembershipStatus;
};

export type RoleAssignment = {
  id: string;
  tenantId: string;
  membershipId: string;
  roleKey: RoleKey;
  scopeType: ScopeType;
  scopeId: string;
  status: MembershipStatus;
};

export const isActive = (status: MembershipStatus) => status === "active";
