import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  canChangeDeliverableStatus,
  getProgressForDeliverableStatus,
} from "@/modules/deliverables/deliverable-rules";
import type {
  DeliverableRecord,
  DeliverableRepository,
} from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import { deriveSlaStatus } from "@/modules/sla/sla-policy";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";
import { updateDeliverableStatusSchema } from "./deliverable-schemas";

const denied = async ({
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
  reason: string;
}) => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId,
    actorUserId: actor.userId,
    action: "DeliverableStatusChangeDenied",
    decision: "denied",
    targetType: "deliverable",
    targetId: deliverableId,
    reason,
  });

  return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
};

const statusSla = ({
  deliverable,
  status,
  now,
}: {
  deliverable: DeliverableRecord;
  status: DeliverableRecord["status"];
  now: string;
}) =>
  deriveSlaStatus({
    status,
    startDate: deliverable.startDate,
    internalDueDate: deliverable.internalDueDate,
    clientDueDate: deliverable.clientDueDate,
    finalDueDate: deliverable.finalDueDate,
    now,
  });

export const updateDeliverableStatusCommand = async ({
  actor,
  deliverables,
  audit,
  input,
  nowFactory = () => new Date().toISOString(),
}: {
  actor: AuthorizationActor;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  input: unknown;
  nowFactory?: () => string;
}) => {
  const parsed = updateDeliverableStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const deliverable = await deliverables.findByTenantClientAndId(
        actor.tenantId,
        parsed.data.clientId,
        parsed.data.deliverableId,
      );

      if (!deliverable) {
        return denied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: parsed.data.deliverableId,
          reason: "deliverable_not_found",
        });
      }

      if (
        parsed.data.expectedRevision !== undefined &&
        parsed.data.expectedRevision !== deliverable.revision
      ) {
        return denied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: "expected_state_mismatch",
        });
      }

      const transition = canChangeDeliverableStatus({
        currentStatus: deliverable.status,
        targetStatus: parsed.data.toStatus,
        requiresClientApproval: deliverable.requiresClientApproval,
      });

      if (!transition.allowed) {
        return denied({
          audit,
          actor,
          clientId: parsed.data.clientId,
          deliverableId: deliverable.id,
          reason: transition.reason,
        });
      }

      if (deliverable.status === parsed.data.toStatus) {
        return {
          ok: true as const,
          value: await deliverables.toSafeSummary(deliverable),
        };
      }

      const transaction = createRequiredAuditAtomicUnitOfWork([deliverables, audit]);
      const occurredAt = nowFactory();
      const previousSla = statusSla({
        deliverable,
        status: deliverable.status,
        now: occurredAt,
      });
      const newSla = statusSla({
        deliverable,
        status: parsed.data.toStatus,
        now: occurredAt,
      });
      const nextProgress = getProgressForDeliverableStatus(parsed.data.toStatus);

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const updated = await deliverables.updateStatus({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            deliverableId: deliverable.id,
            status: parsed.data.toStatus,
            progressPercentage: nextProgress,
          });

          await audit.append({
            tenantId: deliverable.tenantId,
            clientId: deliverable.clientId,
            actorUserId: actor.userId,
            action: "DeliverableStatusChanged",
            decision: "allowed",
            targetType: "deliverable",
            targetId: deliverable.id,
            reason: parsed.data.reason || "status_transition",
            occurredAt,
            metadata: {
              previousStatus: deliverable.status,
              newStatus: updated.status,
              previousProgress: deliverable.progressPercentage,
              newProgress: updated.progressPercentage,
              previousSlaStatus: previousSla.status,
              newSlaStatus: newSla.status,
              requiresClientApproval: deliverable.requiresClientApproval,
            },
          });

          return {
            ok: true as const,
            value: await deliverables.toSafeSummary(updated),
          };
        },
      });
    },
  });
};
