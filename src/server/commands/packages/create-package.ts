import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ContractRepository } from "@/modules/contracts/contract-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import type { PackageRepository } from "@/modules/packages/package-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { createPackageSchema } from "./package-schemas";

const canAttachPackageToContract = (status: string) =>
  status === "draft" || status === "active";

export const createPackageCommand = async ({
  actor,
  contracts,
  packages,
  audit,
  input,
  idFactory = crypto.randomUUID,
  lineIdFactory = () => crypto.randomUUID(),
  ledgerIdFactory = () => crypto.randomUUID(),
}: {
  actor: AuthorizationActor;
  contracts: ContractRepository;
  packages: PackageRepository;
  audit: AuditSink;
  input: unknown;
  idFactory?: () => string;
  lineIdFactory?: (index: number) => string;
  ledgerIdFactory?: (index: number) => string;
}) => {
  const parsed = createPackageSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.PACKAGE_CREATE,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const contract = await contracts.findByTenantClientAndId(
        actor.tenantId,
        parsed.data.clientId,
        parsed.data.contractId,
      );

      if (!contract || !canAttachPackageToContract(contract.status)) {
        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: "PackageScopeDenied",
          decision: "denied",
          targetType: "package",
          targetId: parsed.data.contractId,
          reason: "contract_scope_not_available",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const existing = await packages.findPackageByTenantAndIdempotencyKey(
        actor.tenantId,
        parsed.data.idempotencyKey,
      );

      if (existing) {
        return {
          ok: true as const,
          value: await packages.toSafeSummary(existing),
        };
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([
        packages,
        audit,
      ]);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const packageRecord = await packages.createPackage({
            id: idFactory(),
            tenantId: actor.tenantId,
            clientId: contract.clientId,
            contractId: contract.id,
            name: parsed.data.name,
            periodStart: parsed.data.periodStart,
            periodEnd: parsed.data.periodEnd,
            status: parsed.data.status,
            idempotencyKey: parsed.data.idempotencyKey,
            createdBy: actor.userId,
          });

          for (const [index, line] of parsed.data.lines.entries()) {
            const packageLine = await packages.createPackageLine({
              id: lineIdFactory(index),
              tenantId: actor.tenantId,
              clientId: contract.clientId,
              packageId: packageRecord.id,
              serviceLabel: line.serviceLabel,
              deliverableTypeHint: line.deliverableTypeHint,
              unitLabel: line.unitLabel,
              committedQuantity: line.committedQuantity,
              createdBy: actor.userId,
            });

            await packages.appendLedgerEntry({
              id: ledgerIdFactory(index),
              tenantId: actor.tenantId,
              clientId: contract.clientId,
              contractId: contract.id,
              packageId: packageRecord.id,
              packageLineId: packageLine.id,
              entryType: "commitment_added",
              quantity: line.committedQuantity,
              actorUserId: actor.userId,
              idempotencyKey: `${parsed.data.idempotencyKey}:line:${index}`,
            });
          }

          await audit.append({
            tenantId: actor.tenantId,
            clientId: contract.clientId,
            actorUserId: actor.userId,
            action: "PackageCreated",
            decision: "allowed",
            targetType: "package",
            targetId: packageRecord.id,
          });

          return {
            ok: true as const,
            value: await packages.toSafeSummary(packageRecord),
          };
        },
      });
    },
  });
};
