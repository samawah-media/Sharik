import type { AuditSink } from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { createClientSchema, normalizeClientInput } from "./client-schemas";

export const createClientCommand = async ({
  actor,
  repository,
  audit,
  input,
  idFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  repository: ClientRepository;
  audit: AuditSink;
  input: unknown;
  idFactory?: () => string;
}) => {
  const parsed = createClientSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const { slug } = normalizeClientInput(parsed.data.name);
  const clientId = idFactory();

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.CLIENT_CREATE,
    resource: { tenantId: actor.tenantId },
    audit,
    operation: async () => {
      const duplicate = await repository.findByTenantAndSlug(actor.tenantId, slug);

      if (duplicate) {
        return { ok: false as const, error: "CONFLICT_RETRY" as const };
      }

      const client = await repository.create({
        id: clientId,
        tenantId: actor.tenantId,
        name: parsed.data.name,
        slug,
        primaryContactName: parsed.data.primaryContactName,
        primaryContactEmail: parsed.data.primaryContactEmail || undefined,
        createdBy: actor.userId,
      });

      await audit.append({
        tenantId: actor.tenantId,
        clientId: client.id,
        actorUserId: actor.userId,
        action: "ClientCreated",
        decision: "allowed",
        targetType: "client",
        targetId: client.id,
      });

      return { ok: true as const, value: client };
    },
  });
};
