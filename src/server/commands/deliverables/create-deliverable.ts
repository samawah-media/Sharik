import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { DeliverableRepository } from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import {
  assertCanReserveQuantity,
  projectPackageBalance,
} from "@/modules/packages/package-ledger";
import type { PackageRepository } from "@/modules/packages/package-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { createDeliverableSchema } from "./deliverable-schemas";

const canUsePackageForDeliverable = (status: string) => status === "active";
const canUsePackageLineForDeliverable = (status: string) => status === "active";

export const createDeliverableCommand = async ({
  actor,
  packages,
  deliverables,
  audit,
  input,
  deliverableIdFactory = crypto.randomUUID,
  allocationIdFactory = crypto.randomUUID,
  ledgerIdFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  packages: PackageRepository;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  input: unknown;
  deliverableIdFactory?: () => string;
  allocationIdFactory?: () => string;
  ledgerIdFactory?: () => string;
}) => {
  const parsed = createDeliverableSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.DELIVERABLE_CREATE,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const packageLine = await packages.findPackageLineByTenantAndId(
        actor.tenantId,
        parsed.data.packageLineId,
      );

      if (
        !packageLine ||
        packageLine.clientId !== parsed.data.clientId ||
        packageLine.packageId !== parsed.data.packageId ||
        !canUsePackageLineForDeliverable(packageLine.status)
      ) {
        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: "DeliverableScopeDenied",
          decision: "denied",
          targetType: "package_line",
          targetId: parsed.data.packageLineId,
          reason: "package_line_scope_not_available",
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
      }

      const packageRecord = await packages.findPackageByTenantClientAndId(
        actor.tenantId,
        parsed.data.clientId,
        parsed.data.packageId,
      );

      if (
        !packageRecord ||
        packageRecord.contractId !== parsed.data.contractId ||
        !canUsePackageForDeliverable(packageRecord.status)
      ) {
        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: "DeliverableScopeDenied",
          decision: "denied",
          targetType: "package",
          targetId: parsed.data.packageId,
          reason: "package_scope_not_available",
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

      const currentEntries = await packages.listLedgerByPackageLine(
        packageLine.tenantId,
        packageLine.clientId,
        packageLine.id,
      );
      const balance = projectPackageBalance(currentEntries);
      const reservationDecision = assertCanReserveQuantity(
        balance,
        parsed.data.reservedQuantity,
      );

      if (!reservationDecision.allowed) {
        await audit.append({
          tenantId: packageLine.tenantId,
          clientId: packageLine.clientId,
          actorUserId: actor.userId,
          action: "DeliverableReservationDenied",
          decision: "denied",
          targetType: "package_line",
          targetId: packageLine.id,
          reason: reservationDecision.reason,
        });

        return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
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
            clientId: packageLine.clientId,
            contractId: packageRecord.contractId,
            packageId: packageRecord.id,
            packageLineId: packageLine.id,
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
            approvedExtra: false,
            idempotencyKey: parsed.data.idempotencyKey,
            createdBy: actor.userId,
          });
          const ledgerEntry = await packages.appendLedgerEntry({
            id: ledgerIdFactory(),
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            contractId: packageRecord.contractId,
            packageId: packageRecord.id,
            packageLineId: packageLine.id,
            deliverableId: deliverable.id,
            entryType: "quantity_reserved",
            quantity: parsed.data.reservedQuantity,
            actorUserId: actor.userId,
            idempotencyKey: `${parsed.data.idempotencyKey}:reservation`,
          });

          await deliverables.createAllocation({
            id: allocationIdFactory(),
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            deliverableId: deliverable.id,
            packageLineId: packageLine.id,
            reservedQuantity: parsed.data.reservedQuantity,
            reservationLedgerEntryId: ledgerEntry.id,
          });

          await audit.append({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            actorUserId: actor.userId,
            action: "DeliverableCreated",
            decision: "allowed",
            targetType: "deliverable",
            targetId: deliverable.id,
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
