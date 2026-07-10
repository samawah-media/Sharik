import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { ApprovalRepository } from "@/modules/approvals/approval-repository";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type { PermissionId } from "@/modules/authorization/permission-catalog";
import {
  canPerformR007WorkflowStep,
  r007WorkflowStepTargets,
  type R007WorkflowStep,
} from "@/modules/deliverables/r007-deliverable-lifecycle";
import {
  getProgressForDeliverableStatus,
  type DeliverableLifecycleStatus,
} from "@/modules/deliverables/deliverable-rules";
import type {
  DeliverableRecord,
  DeliverableRepository,
} from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import {
  buildSlaPauseAuditEvent,
  buildSlaResumeAuditEvent,
} from "@/modules/sla/sla-policy";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

export type ApprovalCommandDependencies = {
  actor: AuthorizationActor;
  approvals: ApprovalRepository;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  decisionIdFactory?: () => string;
  nowFactory?: () => string;
};

export type ParsedApprovalCommandInput = {
  clientId: string;
  deliverableId: string;
  versionId: string;
  expectedRevision?: number;
  reason?: string;
  idempotencyKey: string;
};

export type ApprovalCommandConfig = {
  permission: PermissionId;
  workflowStep: R007WorkflowStep;
  auditAction: string;
  denialAuditAction: string;
  approvalType: "internal" | "client";
  decision: "approved" | "changes_requested";
  versionState: "internally_approved" | "client_visible" | "ready_for_internal_review";
  internalApprovalState?: "approved" | "changes_requested";
  clientApprovalState?: "not_sent" | "pending" | "approved" | "changes_requested";
  appendSlaEvent?: "pause_for_client" | "resume_after_client_changes";
};

const denied = async ({
  audit,
  actor,
  input,
  action,
  reason,
}: {
  audit: AuditSink;
  actor: AuthorizationActor;
  input: ParsedApprovalCommandInput;
  action: string;
  reason: string;
}) => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId: input.clientId,
    actorUserId: actor.userId,
    action,
    decision: "denied",
    targetType: "deliverable",
    targetId: input.deliverableId,
    reason,
  });

  return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
};

const findScopedDeliverable = async ({
  deliverables,
  actor,
  input,
  audit,
  denialAuditAction,
}: {
  deliverables: DeliverableRepository;
  actor: AuthorizationActor;
  input: ParsedApprovalCommandInput;
  audit: AuditSink;
  denialAuditAction: string;
}) => {
  const deliverable = await deliverables.findByTenantClientAndId(
    actor.tenantId,
    input.clientId,
    input.deliverableId,
  );

  if (!deliverable) {
    return denied({
      audit,
      actor,
      input,
      action: denialAuditAction,
      reason: "deliverable_not_found",
    });
  }

  if (
    input.expectedRevision !== undefined &&
    input.expectedRevision !== deliverable.revision
  ) {
    return denied({
      audit,
      actor,
      input,
      action: denialAuditAction,
      reason: "expected_state_mismatch",
    });
  }

  return { ok: true as const, deliverable };
};

const appendSlaAuditIfNeeded = async ({
  audit,
  actor,
  deliverable,
  config,
  occurredAt,
}: {
  audit: AuditSink;
  actor: AuthorizationActor;
  deliverable: DeliverableRecord;
  config: ApprovalCommandConfig;
  occurredAt: string;
}) => {
  if (config.appendSlaEvent === "pause_for_client") {
    await audit.append(
      buildSlaPauseAuditEvent({
        tenantId: deliverable.tenantId,
        clientId: deliverable.clientId,
        deliverableId: deliverable.id,
        actorUserId: actor.userId,
        previousStatus: "on_track",
        newStatus: "paused_waiting_client",
        reason: "waiting_client_approval",
        occurredAt,
      }),
    );
  }

  if (config.appendSlaEvent === "resume_after_client_changes") {
    await audit.append(
      buildSlaResumeAuditEvent({
        tenantId: deliverable.tenantId,
        clientId: deliverable.clientId,
        deliverableId: deliverable.id,
        actorUserId: actor.userId,
        previousStatus: "paused_waiting_client",
        newStatus: "on_track",
        reason: "client_changes_requested",
        occurredAt,
      }),
    );
  }
};

export const runApprovalWorkflowCommand = async ({
  dependencies,
  input,
  config,
}: {
  dependencies: ApprovalCommandDependencies;
  input: ParsedApprovalCommandInput;
  config: ApprovalCommandConfig;
}) => {
  const {
    actor,
    approvals,
    deliverables,
    audit,
    decisionIdFactory = () => crypto.randomUUID(),
    nowFactory = () => new Date().toISOString(),
  } = dependencies;

  return runAuthorizedSensitiveOperation({
    actor,
    permission: config.permission,
    resource: { tenantId: actor.tenantId, clientId: input.clientId },
    audit,
    operation: async () => {
      const existingDecision = await approvals.findDecisionByTenantAndIdempotencyKey(
        actor.tenantId,
        input.idempotencyKey,
      );

      if (existingDecision) {
        const deliverable = await deliverables.findByTenantClientAndId(
          actor.tenantId,
          input.clientId,
          input.deliverableId,
        );

        return deliverable
          ? {
              ok: true as const,
              value: await deliverables.toSafeSummary(deliverable),
            }
          : denied({
              audit,
              actor,
              input,
              action: config.denialAuditAction,
              reason: "deliverable_not_found",
            });
      }

      const scopedDeliverable = await findScopedDeliverable({
        deliverables,
        actor,
        input,
        audit,
        denialAuditAction: config.denialAuditAction,
      });

      if (!scopedDeliverable.ok) {
        return scopedDeliverable;
      }

      const version = await approvals.findVersion(
        actor.tenantId,
        input.clientId,
        input.versionId,
      );

      if (!version || version.deliverableId !== input.deliverableId) {
        return denied({
          audit,
          actor,
          input,
          action: config.denialAuditAction,
          reason: "version_not_found",
        });
      }

      const lifecycleDecision = canPerformR007WorkflowStep({
        step: config.workflowStep,
        status: scopedDeliverable.deliverable.status,
        requiresClientApproval: scopedDeliverable.deliverable.requiresClientApproval,
        version,
      });

      if (!lifecycleDecision.allowed) {
        return denied({
          audit,
          actor,
          input,
          action: config.denialAuditAction,
          reason: lifecycleDecision.reason,
        });
      }

      const targetStatus = r007WorkflowStepTargets[config.workflowStep];
      const transaction = createRequiredAuditAtomicUnitOfWork([
        deliverables,
        approvals,
        audit,
      ]);
      const occurredAt = nowFactory();

      return runAuditAtomicMutation({
        transaction,
        operation: async () => {
          const updatedDeliverable = await deliverables.updateStatus({
            tenantId: scopedDeliverable.deliverable.tenantId,
            clientId: scopedDeliverable.deliverable.clientId,
            deliverableId: scopedDeliverable.deliverable.id,
            status: targetStatus,
            progressPercentage: getProgressForDeliverableStatus(
              targetStatus as DeliverableLifecycleStatus,
            ),
          });

          await approvals.updateVersion({
            tenantId: version.tenantId,
            clientId: version.clientId,
            versionId: version.id,
            state: config.versionState,
            internalApprovalState: config.internalApprovalState,
            clientApprovalState: config.clientApprovalState,
          });

          await approvals.appendDecision({
            id: decisionIdFactory(),
            tenantId: version.tenantId,
            clientId: version.clientId,
            deliverableId: version.deliverableId,
            versionId: version.id,
            approvalType: config.approvalType,
            decision: config.decision,
            actorUserId: actor.userId,
            decidedAt: occurredAt,
            reason: input.reason,
            idempotencyKey: input.idempotencyKey,
          });

          await audit.append({
            tenantId: version.tenantId,
            clientId: version.clientId,
            actorUserId: actor.userId,
            action: config.auditAction,
            decision: "allowed",
            targetType: "deliverable",
            targetId: version.deliverableId,
            reason: input.reason || config.auditAction,
            occurredAt,
            metadata: {
              versionNumber: version.versionNumber,
              previousStatus: scopedDeliverable.deliverable.status,
              newStatus: updatedDeliverable.status,
            },
          });

          await appendSlaAuditIfNeeded({
            audit,
            actor,
            deliverable: updatedDeliverable,
            config,
            occurredAt,
          });

          return {
            ok: true as const,
            value: await deliverables.toSafeSummary(updatedDeliverable),
          };
        },
      });
    },
  });
};
