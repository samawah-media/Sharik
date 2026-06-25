import type { AuditSink } from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { normalizeClientInput, updateClientSchema } from "./client-schemas";

export const updateClientCommand = async ({
  actor,
  repository,
  audit,
  input,
}: {
  actor: AuthorizationActor;
  repository: ClientRepository;
  audit: AuditSink;
  input: unknown;
}) => {
  const parsed = updateClientSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const existing = await repository.findByTenantAndId(
    actor.tenantId,
    parsed.data.clientId,
  );

  if (!existing) {
    await audit.append({
      tenantId: actor.tenantId,
      actorUserId: actor.userId,
      action: "ClientUpdateDenied",
      decision: "denied",
      targetType: "client",
      targetId: parsed.data.clientId,
      reason: "client_scope_not_found",
    });

    return { ok: false as const, error: "CLIENT_ACCESS_DENIED" as const };
  }

  const { slug } = normalizeClientInput(parsed.data.name);

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.CLIENT_CREATE,
    resource: { tenantId: existing.tenantId, clientId: existing.id },
    audit,
    operation: async () => {
      const client = await repository.update({
        id: existing.id,
        tenantId: existing.tenantId,
        name: parsed.data.name,
        slug,
        primaryContactName: parsed.data.primaryContactName,
        primaryContactEmail: parsed.data.primaryContactEmail || undefined,
        expectedRevision: parsed.data.expectedRevision,
      });

      if (!client) {
        return { ok: false as const, error: "CONFLICT_RETRY" as const };
      }

      await audit.append({
        tenantId: actor.tenantId,
        clientId: client.id,
        actorUserId: actor.userId,
        action: "ClientUpdated",
        decision: "allowed",
        targetType: "client",
        targetId: client.id,
      });

      return { ok: true as const, value: client };
    },
  });
};
