import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRecord } from "@/modules/clients/client-repository";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  advisoryOnly: true;
};

export type NavigationState =
  | "ready"
  | "no_assigned_clients"
  | "membership_disabled";

export type NavigationResolution = {
  state: NavigationState;
  items: NavigationItem[];
  denial?: {
    copyKey: "f001.access.noAssignedClients" | "f001.access.membershipDisabled";
  };
};

const item = (
  id: string,
  label: string,
  href: string,
): NavigationItem => ({
  id,
  label,
  href,
  advisoryOnly: true,
});

const can = (
  actor: AuthorizationActor,
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  clientId?: string,
) =>
  evaluatePermission({
    actor,
    permission,
    resource: { tenantId: actor.tenantId, clientId },
  }).allowed;

export const resolveRoleAwareNavigation = ({
  actor,
  assignedClients,
}: {
  actor: AuthorizationActor;
  assignedClients: Pick<ClientRecord, "id" | "tenantId" | "name">[];
}): NavigationResolution => {
  if (actor.tenantMembership.status !== "active") {
    return {
      state: "membership_disabled",
      items: [],
      denial: { copyKey: "f001.access.membershipDisabled" },
    };
  }

  if (can(actor, PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT)) {
    return {
      state: "ready",
      items: [
        item("management.dashboard", "لوحة الإدارة", "/portfolio"),
        item("management.clients", "العملاء", "/clients"),
        item("management.members", "الفريق", "/members"),
      ],
    };
  }

  const visibleClients = assignedClients.filter((client) =>
    can(actor, PERMISSIONS.CLIENT_VIEW, client.id),
  );

  const hasClientRole = actor.roleAssignments.some(
    (assignment) =>
      assignment.status === "active" &&
      assignment.scopeType === "client" &&
      (assignment.roleKey === "client_viewer" ||
        assignment.roleKey === "client_approver" ||
        assignment.roleKey === "client_admin"),
  );

  if (hasClientRole && visibleClients.length > 0) {
    const hasApproverRole = actor.roleAssignments.some(
      (assignment) =>
        assignment.status === "active" &&
        assignment.scopeType === "client" &&
        assignment.roleKey === "client_approver",
    );

    return {
      state: "ready",
      items: [
        item("client.home", "الرئيسية", "/client"),
        item("client.deliverables", "مخرجاتي", "/client/commercial#deliverables"),
        item("client.package", "الباقة والمتبقي", "/client/commercial#package"),
        ...(hasApproverRole
          ? [item("client.pendingApprovals", "بانتظار موافقتي", "/client/pending")]
          : []),
      ],
    };
  }

  if (visibleClients.length > 0) {
    return {
      state: "ready",
      items: [
        item("team.work", "مهامي", "/work"),
        item("team.portfolio", "عملائي", "/portfolio"),
      ],
    };
  }

  return {
    state: "no_assigned_clients",
    items: [],
    denial: { copyKey: "f001.access.noAssignedClients" },
  };
};
