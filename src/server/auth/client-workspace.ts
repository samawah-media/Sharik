import type { ClientRecord } from "@/modules/clients/client-repository";
import type { RuntimeContext } from "./runtime-context";
import {
  PERMISSIONS,
  roleGrantsPermission,
} from "@/modules/authorization/permission-catalog";

export function getClientWorkspaces(runtime: RuntimeContext): ClientRecord[] {
  if (!runtime.ok) return [];
  const { actor, clients, clientMemberships } = runtime;
  const membership = actor.tenantMembership;
  if (
    membership.status !== "active" ||
    membership.userId !== actor.userId ||
    membership.tenantId !== actor.tenantId
  )
    return [];
  const scopedIds = new Set(
    actor.roleAssignments
      .filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.tenantId === actor.tenantId &&
          assignment.membershipId === membership.id &&
          assignment.scopeType === "client" &&
          ["client_admin", "client_approver", "client_viewer"].includes(
            assignment.roleKey,
          ) &&
          roleGrantsPermission(assignment.roleKey, PERMISSIONS.CLIENT_VIEW),
      )
      .map((assignment) => assignment.scopeId),
  );
  const memberIds = new Set(
    clientMemberships
      .filter(
        (entry) =>
          entry.status === "active" &&
          entry.tenantId === actor.tenantId &&
          entry.userId === actor.userId,
      )
      .map((entry) => entry.clientId),
  );
  return clients.filter(
    (client) =>
      client.status === "active" &&
      client.tenantId === actor.tenantId &&
      scopedIds.has(client.id) &&
      memberIds.has(client.id),
  );
}

export function selectClientWorkspace(
  runtime: RuntimeContext,
  preferredId?: string,
): ClientRecord | undefined {
  const clients = getClientWorkspaces(runtime);
  return clients.find((client) => client.id === preferredId) ?? clients[0];
}
