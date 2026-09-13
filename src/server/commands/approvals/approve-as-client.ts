import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  clientApprovalCommandSchema,
  type ClientApprovalCommandInput,
} from "./approval-schemas";
import {
  runApprovalWorkflowCommand,
  type ApprovalCommandDependencies,
} from "./approval-command-utils";

export const approveAsClientCommand = async ({
  actor,
  approvals,
  deliverables,
  audit,
  input,
  decisionIdFactory,
  nowFactory,
}: ApprovalCommandDependencies & { input: unknown }) => {
  const parsed = clientApprovalCommandSchema.safeParse(input);

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
    input: parsed.data satisfies ClientApprovalCommandInput,
    config: {
      permission: PERMISSIONS.DELIVERABLE_CLIENT_APPROVE,
      workflowStep: "approve_as_client",
      auditAction: "ClientApprovalRecorded",
      denialAuditAction: "ClientApprovalDenied",
      approvalType: "client",
      decision: "approved",
      versionState: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "approved",
    },
  });
};
