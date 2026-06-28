import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import type { ContractRepository } from "@/modules/contracts/contract-repository";
import { toContractSafeSummary } from "@/modules/contracts/contract-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { createContractSchema } from "./contract-schemas";

export const createContractCommand = async ({
  actor,
  clients,
  contracts,
  audit,
  input,
  idFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  clients: ClientRepository;
  contracts: ContractRepository;
  audit: AuditSink;
  input: unknown;
  idFactory?: () => string;
}) => {
  const parsed = createContractSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.CONTRACT_CREATE,
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
          action: "ContractScopeDenied",
          decision: "denied",
          targetType: "contract",
          targetId: parsed.data.clientId,
          reason: "client_scope_not_available",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const existing = await contracts.findByTenantAndIdempotencyKey(
        actor.tenantId,
        parsed.data.idempotencyKey,
      );

      if (existing) {
        return {
          ok: true as const,
          value: toContractSafeSummary(existing),
        };
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([
        contracts,
        audit,
      ]);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const contract = await contracts.create({
            id: idFactory(),
            tenantId: actor.tenantId,
            clientId: client.id,
            name: parsed.data.name,
            reference: parsed.data.reference,
            summary: parsed.data.summary,
            periodStart: parsed.data.periodStart,
            periodEnd: parsed.data.periodEnd,
            status: parsed.data.status,
            idempotencyKey: parsed.data.idempotencyKey,
            createdBy: actor.userId,
          });

          await audit.append({
            tenantId: actor.tenantId,
            clientId: client.id,
            actorUserId: actor.userId,
            action: "ContractCreated",
            decision: "allowed",
            targetType: "contract",
            targetId: contract.id,
          });

          return {
            ok: true as const,
            value: toContractSafeSummary(contract),
          };
        },
      });
    },
  });
};
