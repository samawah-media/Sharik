import type { ClientRecord } from "@/modules/clients/client-repository";
import type { RoleKey } from "@/modules/memberships/membership";

export type ClientInvitationValidationResult =
  | { ok: true; clientId: string }
  | {
      ok: false;
      error:
        | "CLIENT_ACCESS_DENIED"
        | "ROLE_ASSIGNMENT_DENIED"
        | "VALIDATION_FAILED";
    };

export const clientInvitationRoleKeys = [
  "client_admin",
  "client_approver",
  "client_viewer",
] as const satisfies readonly RoleKey[];

export type ClientInvitationRoleKey =
  (typeof clientInvitationRoleKeys)[number];

export const isClientInvitationRole = (
  roleKey: RoleKey,
): roleKey is ClientInvitationRoleKey =>
  clientInvitationRoleKeys.includes(roleKey as ClientInvitationRoleKey);

export const validateClientInvitationScope = ({
  tenantId,
  roleKey,
  clientIds,
  clients,
}: {
  tenantId: string;
  roleKey: RoleKey;
  clientIds: string[];
  clients: ClientRecord[];
}): ClientInvitationValidationResult => {
  if (!isClientInvitationRole(roleKey)) {
    return { ok: false, error: "ROLE_ASSIGNMENT_DENIED" };
  }

  const distinctClientIds = [...new Set(clientIds.filter(Boolean))];

  if (distinctClientIds.length !== 1) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const client = clients.find((candidate) => candidate.id === distinctClientIds[0]);

  if (!client || client.tenantId !== tenantId || client.status !== "active") {
    return { ok: false, error: "CLIENT_ACCESS_DENIED" };
  }

  return { ok: true, clientId: client.id };
};
