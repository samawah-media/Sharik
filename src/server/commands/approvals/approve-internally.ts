import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  internalApprovalCommandSchema,
  type InternalApprovalCommandInput,
} from "./approval-schemas";
import {
  runApprovalWorkflowCommand,
  type ApprovalCommandDependencies,
} from "./approval-command-utils";

export const approveInternallyCommand = async ({
  actor,
  approvals,
  deliverables,
  audit,
  input,
  decisionIdFactory,
  nowFactory,
}: ApprovalCommandDependencies & { input: unknown }) => {
  const parsed = internalApprovalCommandSchema.safeParse(input);

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
    input: parsed.data satisfies InternalApprovalCommandInput,
    config: {
      permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE,
      workflowStep: "approve_internally",
      auditAction: "InternalApprovalRecorded",
      denialAuditAction: "InternalApprovalDenied",
      approvalType: "internal",
      decision: "approved",
      versionState: "internally_approved",
      internalApprovalState: "approved",
      clientApprovalState: "not_sent",
    },
  });
};
