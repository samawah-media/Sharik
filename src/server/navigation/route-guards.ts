import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRecord } from "@/modules/clients/client-repository";
import type {
  RoleAssignment,
  TenantMembership,
} from "@/modules/memberships/membership";

export type RouteActorKey =
  | "tenant_admin_a"
  | "assigned_internal_a"
  | "tenant_viewer_a"
  | "client_viewer_a"
  | "client_approver_a"
  | "disabled_member_a";

export type RouteAccessDecision =
  | { allowed: true; actor: AuthorizationActor }
  | {
      allowed: false;
      actor?: AuthorizationActor;
      reason: "permission_denied" | "not_found" | "no_assigned_clients" | "membership_disabled";
      safeReturnHref: string;
    };

const routeActorFixturesEnabled = () => process.env.NODE_ENV !== "production";

export const routeClients: ClientRecord[] = [
  {
    id: "client_a",
    tenantId: "tenant_a",
    name: "Client A",
    slug: "client-a",
    status: "active",
    createdBy: "tenant_admin_a",
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    revision: 1,
  },
  {
    id: "client_c",
    tenantId: "tenant_a",
    name: "Client C",
    slug: "client-c",
    status: "active",
    createdBy: "tenant_admin_a",
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    revision: 1,
  },
  {
    id: "client_b",
    tenantId: "tenant_b",
    name: "Client B",
    slug: "client-b",
    status: "active",
    createdBy: "tenant_admin_b",
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    revision: 1,
  },
];

const tenantMembership = (
  id: string,
  userId: string,
  tenantId = "tenant_a",
  status: TenantMembership["status"] = "active",
): TenantMembership => ({ id, userId, tenantId, status });

const role = ({
  id,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  tenantId = "tenant_a",
}: Omit<RoleAssignment, "status" | "tenantId"> & {
  tenantId?: string;
}): RoleAssignment => ({
  id,
  tenantId,
  membershipId,
  roleKey,
  scopeType,
  scopeId,
  status: "active",
});

const actor = (
  userId: string,
  membership: TenantMembership,
  roleAssignments: RoleAssignment[],
): AuthorizationActor => ({
  userId,
  tenantId: membership.tenantId,
  tenantMembership: membership,
  roleAssignments,
});

const unresolvedRouteActor = (): AuthorizationActor => {
  const membership = tenantMembership(
    "tm_route_actor_unresolved",
    "route_actor_unresolved",
    "tenant_a",
    "disabled",
  );

  return actor("route_actor_unresolved", membership, []);
};

export const resolveRouteActor = (
  key: string | undefined,
): AuthorizationActor => {
  if (!routeActorFixturesEnabled()) {
    return unresolvedRouteActor();
  }

  if (key === "assigned_internal_a") {
    const membership = tenantMembership("tm_internal_a", key);
    return actor(key, membership, [
      role({
        id: "ra_internal_client_a",
        membershipId: membership.id,
        roleKey: "account_manager",
        scopeType: "client",
        scopeId: "client_a",
      }),
    ]);
  }

  if (key === "tenant_viewer_a") {
    const membership = tenantMembership("tm_viewer_a", key);
    return actor(key, membership, []);
  }

  if (key === "client_viewer_a" || key === "client_approver_a") {
    const membership = tenantMembership(`tm_${key}`, key);
    return actor(key, membership, [
      role({
        id: `ra_${key}`,
        membershipId: membership.id,
        roleKey: key === "client_approver_a" ? "client_approver" : "client_viewer",
        scopeType: "client",
        scopeId: "client_a",
      }),
    ]);
  }

  if (key === "disabled_member_a") {
    const membership = tenantMembership("tm_disabled_a", key, "tenant_a", "disabled");
    return actor(key, membership, [
      role({
        id: "ra_disabled_a",
        membershipId: membership.id,
        roleKey: "tenant_administrator",
        scopeType: "tenant",
        scopeId: "tenant_a",
      }),
    ]);
  }

  if (key !== undefined && key !== "tenant_admin_a") {
    return unresolvedRouteActor();
  }

  const membership = tenantMembership("tm_admin_a", "tenant_admin_a");
  return actor("tenant_admin_a", membership, [
    role({
      id: "ra_admin_a",
      membershipId: membership.id,
      roleKey: "tenant_administrator",
      scopeType: "tenant",
      scopeId: "tenant_a",
    }),
  ]);
};

const decision = (
  actorInput: AuthorizationActor,
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  resource: { tenantId: string; clientId?: string },
): RouteAccessDecision => {
  if (actorInput.tenantMembership.status !== "active") {
    return {
      allowed: false,
      actor: actorInput,
      reason: "membership_disabled",
      safeReturnHref: "/sign-in",
    };
  }

  const allowed = evaluatePermission({
    actor: actorInput,
    permission,
    resource,
  }).allowed;

  if (allowed) {
    return { allowed: true, actor: actorInput };
  }

  return {
    allowed: false,
    actor: actorInput,
    reason: resource.tenantId === actorInput.tenantId ? "permission_denied" : "not_found",
    safeReturnHref: "/",
  };
};

export const guardManagementRoute = ({
  actor,
  route,
}: {
  actor: AuthorizationActor;
  route: "clients" | "clientWrite" | "members" | "invitations" | "audit";
}): RouteAccessDecision => {
  const permission =
    route === "clients"
      ? PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT
      : route === "clientWrite"
        ? PERMISSIONS.CLIENT_CREATE
      : route === "members"
        ? PERMISSIONS.USER_VIEW
        : route === "invitations"
          ? PERMISSIONS.USER_INVITE
          : PERMISSIONS.AUDIT_USER_VIEW;

  return decision(actor, permission, { tenantId: actor.tenantId });
};

export const guardClientDetailRoute = ({
  actor,
  clientId,
}: {
  actor: AuthorizationActor;
  clientId: string;
}): RouteAccessDecision => {
  const client = routeClients.find((item) => item.id === clientId);

  if (!client) {
    return {
      allowed: false,
      actor,
      reason: "not_found",
      safeReturnHref: "/",
    };
  }

  return decision(actor, PERMISSIONS.CLIENT_VIEW, {
    tenantId: client.tenantId,
    clientId: client.id,
  });
};

export const guardPortfolioRoute = ({
  actor,
}: {
  actor: AuthorizationActor;
}): RouteAccessDecision => {
  if (actor.tenantMembership.status !== "active") {
    return {
      allowed: false,
      actor,
      reason: "membership_disabled",
      safeReturnHref: "/sign-in",
    };
  }

  const hasAssignedClient = routeClients
    .filter((client) => client.tenantId === actor.tenantId)
    .some(
      (client) =>
        evaluatePermission({
          actor,
          permission: PERMISSIONS.CLIENT_VIEW,
          resource: { tenantId: client.tenantId, clientId: client.id },
        }).allowed,
    );

  return hasAssignedClient
    ? { allowed: true, actor }
    : {
        allowed: false,
        actor,
        reason: "no_assigned_clients",
        safeReturnHref: "/",
      };
};
