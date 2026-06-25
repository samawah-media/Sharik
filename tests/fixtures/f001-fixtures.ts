import type { AuthSession } from "@/modules/auth/session";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type {
  ClientMembership,
  RoleAssignment,
  TenantMembership,
} from "@/modules/memberships/membership";
import type { RlsActor } from "@/modules/rls/tenant-isolation-policy";

export const tenantA = { id: "tenant_a", name: "Tenant A" };
export const tenantB = { id: "tenant_b", name: "Tenant B" };

export const clientA = {
  id: "client_a",
  tenantId: tenantA.id,
  name: "Client A",
};

export const clientB = {
  id: "client_b",
  tenantId: tenantB.id,
  name: "Client B",
};

export const clientC = {
  id: "client_c",
  tenantId: tenantA.id,
  name: "Client C",
};

const session = (userId: string): AuthSession => ({
  userId,
  email: `${userId}@example.test`,
});

const tenantMembership = (
  id: string,
  userId: string,
  tenantId: string,
  status: TenantMembership["status"] = "active",
): TenantMembership => ({
  id,
  tenantId,
  userId,
  status,
});

const roleAssignment = ({
  id,
  tenantId,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  status = "active",
}: RoleAssignment): RoleAssignment => ({
  id,
  tenantId,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  status,
});

const actor = ({
  userId,
  membership,
  roles,
}: {
  userId: string;
  membership: TenantMembership;
  roles: RoleAssignment[];
}): AuthorizationActor => ({
  userId,
  tenantId: membership.tenantId,
  tenantMembership: membership,
  roleAssignments: roles,
});

const rlsActor = ({
  userId,
  memberships,
}: {
  userId: string;
  memberships: TenantMembership[];
}): RlsActor => ({
  userId,
  tenantMemberships: memberships,
});

const adminSession = session("tenant_admin_a");
const adminMembership = tenantMembership(
  "tm_admin_a",
  adminSession.userId,
  tenantA.id,
);
const adminRole = roleAssignment({
  id: "ra_admin_a",
  tenantId: tenantA.id,
  membershipId: adminMembership.id,
  roleKey: "tenant_administrator",
  scopeType: "tenant",
  scopeId: tenantA.id,
  status: "active",
});

export const tenantAdminA = {
  session: adminSession,
  tenantMemberships: [adminMembership],
  authorizationActor: actor({
    userId: adminSession.userId,
    membership: adminMembership,
    roles: [adminRole],
  }),
  rlsActor: rlsActor({
    userId: adminSession.userId,
    memberships: [adminMembership],
  }),
};

const viewerSession = session("tenant_viewer_a");
const viewerMembership = tenantMembership(
  "tm_viewer_a",
  viewerSession.userId,
  tenantA.id,
);

export const tenantViewerA = {
  session: viewerSession,
  tenantMemberships: [viewerMembership],
  authorizationActor: actor({
    userId: viewerSession.userId,
    membership: viewerMembership,
    roles: [],
  }),
};

const assignedInternalSession = session("assigned_internal_a");
const assignedInternalMembership = tenantMembership(
  "tm_internal_a",
  assignedInternalSession.userId,
  tenantA.id,
);
const assignedInternalRole = roleAssignment({
  id: "ra_internal_client_a",
  tenantId: tenantA.id,
  membershipId: assignedInternalMembership.id,
  roleKey: "account_manager",
  scopeType: "client",
  scopeId: clientA.id,
  status: "active",
});

export const assignedInternalA = {
  session: assignedInternalSession,
  tenantMemberships: [assignedInternalMembership],
  authorizationActor: actor({
    userId: assignedInternalSession.userId,
    membership: assignedInternalMembership,
    roles: [assignedInternalRole],
  }),
};

const clientViewerSession = session("client_viewer_a");
const clientViewerMembership: ClientMembership = {
  id: "cm_client_viewer_a",
  tenantId: clientA.tenantId,
  clientId: clientA.id,
  userId: clientViewerSession.userId,
  status: "active",
};
const clientViewerRole = roleAssignment({
  id: "ra_client_viewer_a",
  tenantId: clientA.tenantId,
  membershipId: clientViewerMembership.id,
  roleKey: "client_viewer",
  scopeType: "client",
  scopeId: clientA.id,
  status: "active",
});

export const clientViewerA = {
  session: clientViewerSession,
  clientMemberships: [clientViewerMembership],
  authorizationActor: actor({
    userId: clientViewerSession.userId,
    membership: tenantMembership(
      "tm_client_viewer_context_a",
      clientViewerSession.userId,
      clientA.tenantId,
    ),
    roles: [clientViewerRole],
  }),
};

const disabledSession = session("disabled_member_a");
const inactiveMembership = tenantMembership(
  "tm_disabled_a",
  disabledSession.userId,
  tenantA.id,
  "disabled",
);
const inactiveRole = roleAssignment({
  id: "ra_disabled_a",
  tenantId: tenantA.id,
  membershipId: inactiveMembership.id,
  roleKey: "tenant_administrator",
  scopeType: "tenant",
  scopeId: tenantA.id,
  status: "active",
});

export const disabledTenantMember = {
  session: disabledSession,
  tenantMemberships: [inactiveMembership],
  authorizationActor: actor({
    userId: disabledSession.userId,
    membership: inactiveMembership,
    roles: [inactiveRole],
  }),
};

export const actorWithoutMembership = {
  session: session("unassigned_user"),
  tenantMemberships: [],
};
