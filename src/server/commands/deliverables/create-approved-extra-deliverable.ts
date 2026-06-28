import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import type { DeliverableRepository } from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import type { PackageRepository } from "@/modules/packages/package-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { createApprovedExtraDeliverableSchema } from "./deliverable-schemas";

export const createApprovedExtraDeliverableCommand = async ({
  actor,
  clients,
  packages,
  deliverables,
  audit,
  input,
  deliverableIdFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  clients: ClientRepository;
  packages: PackageRepository;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  input: unknown;
  deliverableIdFactory?: () => string;
}) => {
  const parsed = createApprovedExtraDeliverableSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.DELIVERABLE_EXTRA_CREATE,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const client = await clients.findByTenantAndId(
        actor.tenantId,
        parsed.data.clientId,
      );

      if (!client || client.status !== "active") {
        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: "ApprovedExtraDeliverableScopeDenied",
          decision: "denied",
          targetType: "client",
          targetId: parsed.data.clientId,
          reason: "client_scope_not_available",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const existing = await deliverables.findByTenantAndIdempotencyKey(
        actor.tenantId,
        parsed.data.idempotencyKey,
      );

      if (existing) {
        return {
          ok: true as const,
          value: await deliverables.toSafeSummary(existing),
        };
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([
        deliverables,
        packages,
        audit,
      ]);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const deliverable = await deliverables.create({
            id: deliverableIdFactory(),
            tenantId: actor.tenantId,
            clientId: client.id,
            name: parsed.data.name,
            description: parsed.data.description,
            type: parsed.data.type,
            priority: parsed.data.priority,
            ownerUserId: parsed.data.ownerUserId,
            contributorUserIds: parsed.data.contributorUserIds,
            startDate: parsed.data.startDate,
            internalDueDate: parsed.data.internalDueDate,
            clientDueDate: parsed.data.clientDueDate,
            finalDueDate: parsed.data.finalDueDate,
            requiresInternalApproval: parsed.data.requiresInternalApproval,
            requiresClientApproval: parsed.data.requiresClientApproval,
            approvedExtra: true,
            extraReason: parsed.data.extraReason,
            idempotencyKey: parsed.data.idempotencyKey,
            createdBy: actor.userId,
          });

          await audit.append({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            actorUserId: actor.userId,
            action: "ApprovedExtraDeliverableCreated",
            decision: "allowed",
            targetType: "deliverable",
            targetId: deliverable.id,
            reason: "approved_extra_recorded",
          });

          return {
            ok: true as const,
            value: await deliverables.toSafeSummary(deliverable),
          };
        },
      });
    },
  });
};
