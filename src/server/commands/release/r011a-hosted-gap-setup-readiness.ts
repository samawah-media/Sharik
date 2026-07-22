import { z } from "zod";
import type { AuditSink } from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { safeDeniedError, type UnsafeErrorInput } from "@/modules/errors/safe-errors";
import {
  R011A_GAP_SETUP_CATEGORIES,
  type R011AApprovedScope,
  type R011AGapSetupCategory,
  type R011AGapSetupDeniedReason,
  type R011AOwnerApproval,
} from "@/modules/release/r011a-gap-setup-plan";
import type { R011AGapSetupRepository } from "@/modules/release/r011a-gap-setup-repository";
import {
  runR011AGapSetupCommand,
  type R011AGapSetupCommandCategoryResult,
} from "./r011a-gap-setup";

export const R011A_HOSTED_EXECUTION_MODES = [
  "hosted_dry_run",
  "apply_hosted",
] as const;

export type R011AHostedExecutionMode =
  (typeof R011A_HOSTED_EXECUTION_MODES)[number];

export const R011A_HOSTED_DRY_RUN_APPROVAL_CATEGORY =
  "r011a_hosted_dry_run_noop_rehearsal" as const;

export const R011A_HOSTED_APPLY_APPROVAL_CATEGORY =
  "r011a_apply_hosted_bounded_mutation" as const;

export type R011AHostedDryRunApproval = {
  approved: boolean;
  approvalCategory: typeof R011A_HOSTED_DRY_RUN_APPROVAL_CATEGORY;
  hadnaOnly: boolean;
  readOnlyNoOp: boolean;
  evidenceValueFree: boolean;
};

export type R011AHostedApplyApproval = {
  approved: boolean;
  approvalCategory: typeof R011A_HOSTED_APPLY_APPROVAL_CATEGORY;
  hadnaOnly: boolean;
  evidenceValueFree: boolean;
  rollbackPlanApproved: boolean;
  operatorWindowApproved: boolean;
  stopConditionsReviewed: boolean;
  maxCounts: Record<R011AGapSetupCategory, number>;
};

const r011aHostedGapSetupReadinessSchema = z.object({
  tenantId: z.string().trim().min(1).optional(),
  clientId: z.string().trim().min(1),
  executionMode: z.enum(R011A_HOSTED_EXECUTION_MODES),
  categories: z
    .array(
      z.object({
        category: z.enum(R011A_GAP_SETUP_CATEGORIES),
        operation: z.string().trim().min(1),
        requestedCount: z.number().int().min(1).max(3).default(1),
        idempotencyKey: z.string().trim().min(8).max(120),
      }),
    )
    .min(1)
    .max(3),
  hostedMutationRequested: z.boolean().optional(),
  productionAcceptanceRequested: z.boolean().optional(),
  fileContentOperationRequested: z.boolean().optional(),
  nonHadnaDataRequested: z.boolean().optional(),
});

type R011AHostedGapSetupDeniedReason =
  | R011AGapSetupDeniedReason
  | "management_authority_required"
  | "idempotency_scope_mismatch"
  | "hosted_dry_run_approval_missing"
  | "hosted_dry_run_approval_incomplete"
  | "hosted_apply_approval_missing"
  | "hosted_apply_approval_incomplete"
  | "hosted_apply_executor_not_configured";

type R011AHostedGapSetupStatus =
  R011AGapSetupCommandCategoryResult["status"];

export type R011AHostedGapSetupEvidenceSummary = {
  executionMode: R011AHostedExecutionMode;
  allowed: boolean;
  categoryCount: number;
  requestedItemCount: number;
  deniedReasonCount: number;
  statusCounts: Partial<Record<R011AHostedGapSetupStatus, number>>;
  categories: R011AGapSetupCommandCategoryResult[];
  hostedMutationCount: 0;
  hostedFileOperationCount: 0;
  productionAcceptanceCount: 0;
  sensitiveValueCount: 0;
};

export type R011AHostedGapSetupReadinessValue = {
  executionMode: R011AHostedExecutionMode;
  createdCount: number;
  noOpCount: number;
  wouldCreateCount: number;
  rollbackRequired: false;
  hostedMutationCount: 0;
  hostedFileOperationCount: 0;
  productionAcceptanceCount: 0;
  evidenceSummary: R011AHostedGapSetupEvidenceSummary;
};

export type R011AHostedGapSetupReadinessResult =
  | { ok: true; value: R011AHostedGapSetupReadinessValue }
  | {
      ok: false;
      error: UnsafeErrorInput | "VALIDATION_FAILED";
      reason?: R011AHostedGapSetupDeniedReason;
    };

const buildStatusCounts = (
  categories: R011AGapSetupCommandCategoryResult[],
) =>
  categories.reduce<Partial<Record<R011AHostedGapSetupStatus, number>>>(
    (counts, category) => {
      counts[category.status] = (counts[category.status] ?? 0) + 1;
      return counts;
    },
    {},
  );

export const buildR011AHostedGapSetupEvidenceSummary = ({
  executionMode,
  allowed,
  categories,
  requestedItemCount,
  deniedReasonCount,
}: {
  executionMode: R011AHostedExecutionMode;
  allowed: boolean;
  categories: R011AGapSetupCommandCategoryResult[];
  requestedItemCount: number;
  deniedReasonCount: number;
}): R011AHostedGapSetupEvidenceSummary => ({
  executionMode,
  allowed,
  categoryCount: categories.length,
  requestedItemCount,
  deniedReasonCount,
  statusCounts: buildStatusCounts(categories),
  categories: categories.map((category) => ({
    category: category.category,
    status: category.status,
  })),
  hostedMutationCount: 0,
  hostedFileOperationCount: 0,
  productionAcceptanceCount: 0,
  sensitiveValueCount: 0,
});

const validateHostedDryRunApproval = (
  approval?: R011AHostedDryRunApproval,
): R011AHostedGapSetupDeniedReason | undefined => {
  if (!approval?.approved) {
    return "hosted_dry_run_approval_missing";
  }

  if (
    approval.approvalCategory !== R011A_HOSTED_DRY_RUN_APPROVAL_CATEGORY ||
    !approval.hadnaOnly ||
    !approval.readOnlyNoOp ||
    !approval.evidenceValueFree
  ) {
    return "hosted_dry_run_approval_incomplete";
  }

  return undefined;
};

const validateHostedApplyApproval = (
  approval?: R011AHostedApplyApproval,
): R011AHostedGapSetupDeniedReason | undefined => {
  if (!approval?.approved) {
    return "hosted_apply_approval_missing";
  }

  if (
    approval.approvalCategory !== R011A_HOSTED_APPLY_APPROVAL_CATEGORY ||
    !approval.hadnaOnly ||
    !approval.evidenceValueFree ||
    !approval.rollbackPlanApproved ||
    !approval.operatorWindowApproved ||
    !approval.stopConditionsReviewed
  ) {
    return "hosted_apply_approval_incomplete";
  }

  return undefined;
};

const appendHostedDeniedAudit = async ({
  audit,
  actor,
  clientId,
  reason,
}: {
  audit: AuditSink;
  actor: AuthorizationActor;
  clientId: string;
  reason: R011AHostedGapSetupDeniedReason;
}): Promise<R011AHostedGapSetupReadinessResult> => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId,
    actorUserId: actor.userId,
    action: "R011AHostedGapSetupDenied",
    decision: "denied",
    targetType: "r011a_hosted_gap_setup",
    targetId: clientId,
    reason,
  });

  return { ok: false, error: safeDeniedError("ACCESS_DENIED"), reason };
};

export const runR011AHostedGapSetupReadinessCommand = async ({
  actor,
  audit,
  setupRepository,
  approvedScope,
  ownerApproval,
  hostedDryRunApproval,
  hostedApplyApproval,
  input,
}: {
  actor: AuthorizationActor;
  audit: AuditSink;
  setupRepository: R011AGapSetupRepository;
  approvedScope: R011AApprovedScope;
  ownerApproval?: R011AOwnerApproval;
  hostedDryRunApproval?: R011AHostedDryRunApproval;
  hostedApplyApproval?: R011AHostedApplyApproval;
  input: unknown;
}): Promise<R011AHostedGapSetupReadinessResult> => {
  const parsed = r011aHostedGapSetupReadinessSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  if (parsed.data.executionMode === "apply_hosted") {
    const approvalReason = validateHostedApplyApproval(hostedApplyApproval);

    if (approvalReason) {
      return appendHostedDeniedAudit({
        audit,
        actor,
        clientId: parsed.data.clientId,
        reason: approvalReason,
      });
    }

    return appendHostedDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: "hosted_apply_executor_not_configured",
    });
  }

  const dryRunApprovalReason =
    validateHostedDryRunApproval(hostedDryRunApproval);

  if (dryRunApprovalReason) {
    return appendHostedDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: dryRunApprovalReason,
    });
  }

  const dryRun = await runR011AGapSetupCommand({
    actor,
    audit,
    setupRepository,
    approvedScope,
    ownerApproval,
    input: {
      tenantId: parsed.data.tenantId,
      clientId: parsed.data.clientId,
      categories: parsed.data.categories,
      hostedMutationRequested: parsed.data.hostedMutationRequested,
      productionAcceptanceRequested: parsed.data.productionAcceptanceRequested,
      fileContentOperationRequested: parsed.data.fileContentOperationRequested,
      nonHadnaDataRequested: parsed.data.nonHadnaDataRequested,
      mode: "dry_run",
    },
  });

  if (!dryRun.ok) {
    return dryRun;
  }

  const requestedItemCount = dryRun.value.categories.length;
  const evidenceSummary = buildR011AHostedGapSetupEvidenceSummary({
    executionMode: "hosted_dry_run",
    allowed: true,
    categories: dryRun.value.categories,
    requestedItemCount,
    deniedReasonCount: 0,
  });

  await audit.append({
    tenantId: actor.tenantId,
    clientId: parsed.data.clientId,
    actorUserId: actor.userId,
    action: "R011AHostedGapSetupDryRunRehearsed",
    decision: "allowed",
    targetType: "r011a_hosted_gap_setup",
    targetId: parsed.data.clientId,
    metadata: {
      categoryCount: evidenceSummary.categoryCount,
      requestedItemCount: evidenceSummary.requestedItemCount,
      hostedMutationCount: 0,
      hostedFileOperationCount: 0,
      productionAcceptanceCount: 0,
      sensitiveValueCount: 0,
    },
  });

  return {
    ok: true,
    value: {
      executionMode: "hosted_dry_run",
      createdCount: 0,
      noOpCount: dryRun.value.noOpCount,
      wouldCreateCount: dryRun.value.wouldCreateCount,
      rollbackRequired: false,
      hostedMutationCount: 0,
      hostedFileOperationCount: 0,
      productionAcceptanceCount: 0,
      evidenceSummary,
    },
  };
};
