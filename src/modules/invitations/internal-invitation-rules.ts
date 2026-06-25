import type { ClientRecord } from "@/modules/clients/client-repository";
import type { RoleKey } from "@/modules/memberships/membership";

export type InternalInvitationValidationResult =
  | { ok: true; clientIds: string[] }
  | {
      ok: false;
      error:
        | "CLIENT_ACCESS_DENIED"
        | "ROLE_ASSIGNMENT_DENIED"
        | "VALIDATION_FAILED";
    };

export const internalInvitationRoleKeys = [
  "account_manager",
  "content_writer",
  "designer",
] as const satisfies readonly RoleKey[];

export type InternalInvitationRoleKey =
  (typeof internalInvitationRoleKeys)[number];

export const isInternalInvitationRole = (
  roleKey: RoleKey,
): roleKey is InternalInvitationRoleKey =>
  internalInvitationRoleKeys.includes(roleKey as InternalInvitationRoleKey);

export const validateInternalInvitationScope = ({
  tenantId,
  roleKey,
  clientIds,
  clients,
}: {
  tenantId: string;
  roleKey: RoleKey;
  clientIds: string[];
  clients: ClientRecord[];
}): InternalInvitationValidationResult => {
  if (!isInternalInvitationRole(roleKey)) {
    return { ok: false, error: "ROLE_ASSIGNMENT_DENIED" };
  }

  const distinctClientIds = [...new Set(clientIds.filter(Boolean))];

  if (distinctClientIds.length === 0) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const clientLookup = new Map(clients.map((client) => [client.id, client]));

  for (const clientId of distinctClientIds) {
    const client = clientLookup.get(clientId);

    if (!client || client.tenantId !== tenantId || client.status !== "active") {
      return { ok: false, error: "CLIENT_ACCESS_DENIED" };
    }
  }

  return { ok: true, clientIds: distinctClientIds.sort() };
};
