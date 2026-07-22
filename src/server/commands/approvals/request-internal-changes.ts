import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  internalChangesCommandSchema,
  type InternalChangesCommandInput,
} from "./approval-schemas";
import {
  runApprovalWorkflowCommand,
  type ApprovalCommandDependencies,
} from "./approval-command-utils";

export const requestInternalChangesCommand = async ({
  actor,
  approvals,
  deliverables,
  audit,
  input,
  decisionIdFactory,
  nowFactory,
}: ApprovalCommandDependencies & { input: unknown }) => {
  const parsed = internalChangesCommandSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runApprovalWorkflowCommand({
    dependencies: {
      actor,
      approvals,
      deliverables,
      audit,
      decisionIdFactory,
      nowFactory,
    },
    input: parsed.data satisfies InternalChangesCommandInput,
    config: {
      permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
      workflowStep: "request_internal_changes",
      auditAction: "InternalChangesRequested",
      denialAuditAction: "InternalChangesDenied",
      approvalType: "internal",
      decision: "changes_requested",
      versionState: "ready_for_internal_review",
      internalApprovalState: "changes_requested",
      clientApprovalState: "not_sent",
    },
  });
};
