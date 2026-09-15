import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  clientChangesCommandSchema,
  type ClientChangesCommandInput,
} from "./approval-schemas";
import {
  runApprovalWorkflowCommand,
  type ApprovalCommandDependencies,
} from "./approval-command-utils";

export const requestClientChangesCommand = async ({
  actor,
  approvals,
  deliverables,
  audit,
  input,
  decisionIdFactory,
  nowFactory,
}: ApprovalCommandDependencies & { input: unknown }) => {
  const parsed = clientChangesCommandSchema.safeParse(input);

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
    input: parsed.data satisfies ClientChangesCommandInput,
    config: {
      permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
      workflowStep: "request_client_changes",
      auditAction: "ClientChangesRequested",
      denialAuditAction: "ClientChangesDenied",
      approvalType: "client",
      decision: "changes_requested",
      versionState: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "changes_requested",
      appendSlaEvent: "resume_after_client_changes",
    },
  });
};
