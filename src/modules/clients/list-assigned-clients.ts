import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import type { ClientRecord, ClientRepository } from "./client-repository";

export const listAssignedClients = async ({
  actor,
  repository,
}: {
  actor: AuthorizationActor;
  repository: ClientRepository;
}): Promise<ClientRecord[]> => {
  const tenantDecision = evaluatePermission({
    actor,
    permission: PERMISSIONS.CLIENT_VIEW_ALL_IN_TENANT,
    resource: { tenantId: actor.tenantId },
  });

  const candidates = await repository.listByTenant(actor.tenantId);

  if (tenantDecision.allowed) {
    return candidates;
  }

  return candidates.filter((client) => {
    const decision = evaluatePermission({
      actor,
      permission: PERMISSIONS.CLIENT_VIEW,
      resource: { tenantId: client.tenantId, clientId: client.id },
    });

    return decision.allowed;
  });
};
