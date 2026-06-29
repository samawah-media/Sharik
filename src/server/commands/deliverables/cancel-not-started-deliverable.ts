import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  canCancelDeliverableReservation,
  type CancellationDecision,
} from "@/modules/deliverables/deliverable-rules";
import type {
  DeliverableAllocationRecord,
  DeliverableRepository,
  DeliverableSafeSummary,
} from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import type { PackageRepository } from "@/modules/packages/package-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { cancelNotStartedDeliverableSchema } from "./deliverable-schemas";

const cancellationReleaseKey = (idempotencyKey: string) =>
  `${idempotencyKey}:reservation_release`;

const cancellationDenied = async ({
  audit,
  actor,
  clientId,
  deliverableId,
  reason,
}: {
  audit: AuditSink;
  actor: AuthorizationActor;
  clientId: string;
  deliverableId: string;
  reason: CancellationDecision extends { allowed: false; reason: infer R }
    ? R
    : string;
}) => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId,
    actorUserId: actor.userId,
    action: "DeliverableCancellationDenied",
    decision: "denied",
    targetType: "deliverable",
    targetId: deliverableId,
    reason: String(reason),
  });

  return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
};

const findReservedAllocation = (
  allocations: DeliverableAllocationRecord[],
) => allocations.find((allocation) => allocation.status === "reserved");

export const cancelNotStartedDeliverableCommand = async ({
  actor,
  packages,
  deliverables,
  audit,
  input,
  ledgerIdFactory = crypto.randomUUID,
}: {
  actor: AuthorizationActor;
  packages: PackageRepository;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  input: unknown;
  ledgerIdFactory?: () => string;
}) => {
  const parsed = cancelNotStartedDeliverableSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.DELIVERABLE_CANCEL_NOT_STARTED,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const deliverable = await deliverables.findByTenantClientAndId(
        actor.tenantId,
        parsed.data.clientId,
        parsed.data.deliverableId,
      );

      if (!deliverable) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: parsed.data.deliverableId,
          reason: "reservation_not_available",
        });
      }

      const releaseKey = cancellationReleaseKey(parsed.data.idempotencyKey);
      const existingRelease = await packages.findLedgerByTenantAndIdempotencyKey(
        actor.tenantId,
        releaseKey,
      );

      if (existingRelease?.deliverableId === deliverable.id) {
        return {
          ok: true as const,
          value: await deliverables.toSafeSummary(deliverable),
        };
      }

      if (existingRelease) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: parsed.data.deliverableId,
          reason: "reservation_not_available",
        });
      }

      const stateDecision = canCancelDeliverableReservation(deliverable.status);

      if (!stateDecision.allowed) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: stateDecision.reason,
        });
      }

      if (
        (parsed.data.expectedStatus &&
          parsed.data.expectedStatus !== deliverable.status) ||
        (parsed.data.expectedRevision !== undefined &&
          parsed.data.expectedRevision !== deliverable.revision)
      ) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: "expected_state_mismatch",
        });
      }

      if (
        !deliverable.contractId ||
        !deliverable.packageId ||
        !deliverable.packageLineId
      ) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: "reservation_not_available",
        });
      }

      const allocations = await deliverables.listAllocationsByDeliverable(
        actor.tenantId,
        parsed.data.clientId,
        deliverable.id,
      );
      const reservedAllocation = findReservedAllocation(allocations);

      if (!reservedAllocation) {
        return cancellationDenied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: "reservation_not_available",
        });
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([
        deliverables,
        packages,
        audit,
      ]);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const releaseLedger = await packages.appendLedgerEntry({
            id: ledgerIdFactory(),
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            contractId: deliverable.contractId as string,
            packageId: deliverable.packageId as string,
            packageLineId: reservedAllocation.packageLineId,
            deliverableId: deliverable.id,
            entryType: "reservation_released",
            quantity: reservedAllocation.reservedQuantity,
            reason: parsed.data.reason,
            actorUserId: actor.userId,
            idempotencyKey: releaseKey,
          });

          await deliverables.releaseAllocation({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            allocationId: reservedAllocation.id,
            releaseLedgerEntryId: releaseLedger.id,
          });

          const cancelled = await deliverables.cancelNotStarted({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            deliverableId: deliverable.id,
          });

          await audit.append({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            actorUserId: actor.userId,
            action: "DeliverableCancelled",
            decision: "allowed",
            targetType: "deliverable",
            targetId: deliverable.id,
            reason: "reservation_released",
          });

          const summary: DeliverableSafeSummary =
            await deliverables.toSafeSummary(cancelled);

          return { ok: true as const, value: summary };
        },
      });
    },
  });
};
