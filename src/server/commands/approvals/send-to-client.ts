import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import {
  sendToClientCommandSchema,
  type SendToClientCommandInput,
} from "./approval-schemas";
import {
  runApprovalWorkflowCommand,
  type ApprovalCommandDependencies,
} from "./approval-command-utils";

export const sendToClientCommand = async ({
  actor,
  approvals,
  deliverables,
  audit,
  input,
  decisionIdFactory,
  nowFactory,
}: ApprovalCommandDependencies & { input: unknown }) => {
  const parsed = sendToClientCommandSchema.safeParse(input);

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
    input: parsed.data satisfies SendToClientCommandInput,
    config: {
      permission: PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT,
      workflowStep: "send_to_client",
      auditAction: "DeliverableSentToClient",
      denialAuditAction: "SendToClientDenied",
      approvalType: "internal",
      decision: "approved",
      versionState: "client_visible",
      internalApprovalState: "approved",
      clientApprovalState: "pending",
      appendSlaEvent: "pause_for_client",
    },
  });
};
