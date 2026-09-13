import { z } from "zod";
import {
  createRequiredAuditAtomicUnitOfWork,
  runAuditAtomicMutation,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { safeDeniedError, type UnsafeErrorInput } from "@/modules/errors/safe-errors";
import { isActive, type RoleKey } from "@/modules/memberships/membership";
import {
  buildR011AGapSetupPlan,
  R011A_GAP_SETUP_CATEGORIES,
  R011A_GAP_SETUP_MODES,
  type R011AApprovedScope,
  type R011AGapSetupCategory,
  type R011AGapSetupDeniedReason,
  type R011AGapSetupPlannedOperation,
  type R011AGapSetupRequest,
  type R011AOwnerApproval,
} from "@/modules/release/r011a-gap-setup-plan";
import type {
  R011AGapSetupRecord,
  R011AGapSetupRepository,
} from "@/modules/release/r011a-gap-setup-repository";

const r011aGapSetupCommandSchema = z.object({
  tenantId: z.string().trim().min(1).optional(),
  clientId: z.string().trim().min(1),
  mode: z.enum(R011A_GAP_SETUP_MODES),
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

type R011AGapSetupCommandInput = z.infer<typeof r011aGapSetupCommandSchema>;

type R011AGapSetupCommandDeniedReason =
  | R011AGapSetupDeniedReason
  | "management_authority_required"
  | "idempotency_scope_mismatch";

export type R011AGapSetupCommandCategoryResult = {
  category: R011AGapSetupCategory;
  status:
    | "would_create"
    | "created"
    | "already_ready"
    | "rollback_no_op_available"
    | "no_setup_record";
};

export type R011AGapSetupCommandValue = {
  mode: R011AGapSetupCommandInput["mode"];
  createdCount: number;
  noOpCount: number;
  wouldCreateCount: number;
  rollbackRequired: false;
  categories: R011AGapSetupCommandCategoryResult[];
};

export type R011AGapSetupCommandResult =
  | { ok: true; value: R011AGapSetupCommandValue }
  | {
      ok: false;
      error: UnsafeErrorInput | "VALIDATION_FAILED";
      reason?: R011AGapSetupCommandDeniedReason;
    };

type OperationInspection = {
  operation: R011AGapSetupPlannedOperation;
  existing?: R011AGapSetupRecord;
  conflict: boolean;
};

const managementRoleKeys = new Set<RoleKey>([
  "tenant_owner",
  "tenant_administrator",
]);

export const hasR011AGapSetupManagementAuthority = (
  actor: AuthorizationActor,
) => {
  if (!isActive(actor.tenantMembership.status)) {
    return false;
  }

  return actor.roleAssignments.some(
    (assignment) =>
      isActive(assignment.status) &&
      assignment.tenantId === actor.tenantId &&
      assignment.scopeType === "tenant" &&
      assignment.scopeId === actor.tenantId &&
      managementRoleKeys.has(assignment.roleKey),
  );
};

const appendDeniedAudit = async ({
  audit,
  actor,
  clientId,
  reason,
}: {
  audit: AuditSink;
  actor: AuthorizationActor;
  clientId: string;
  reason: R011AGapSetupCommandDeniedReason;
}): Promise<R011AGapSetupCommandResult> => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId,
    actorUserId: actor.userId,
    action: "R011AGapSetupDenied",
    decision: "denied",
    targetType: "r011a_gap_setup",
    targetId: clientId,
    reason,
  });

  return { ok: false, error: safeDeniedError("ACCESS_DENIED"), reason };
};

const inspectOperations = async ({
  setupRepository,
  actor,
  clientId,
  operations,
}: {
  setupRepository: R011AGapSetupRepository;
  actor: AuthorizationActor;
  clientId: string;
  operations: R011AGapSetupPlannedOperation[];
}): Promise<OperationInspection[]> => {
  const inspections: OperationInspection[] = [];

  for (const operation of operations) {
    const existingByKey = await setupRepository.findByTenantAndIdempotencyKey(
      actor.tenantId,
      operation.idempotencyKey,
    );

    if (
      existingByKey &&
      (existingByKey.clientId !== clientId ||
        existingByKey.category !== operation.category)
    ) {
      inspections.push({ operation, existing: existingByKey, conflict: true });
      continue;
    }

    const existing =
      existingByKey ??
      (await setupRepository.findByTenantClientCategory(
        actor.tenantId,
        clientId,
        operation.category,
      ));

    inspections.push({ operation, existing, conflict: false });
  }

  return inspections;
};

const hasConflict = (inspections: OperationInspection[]) =>
  inspections.some((inspection) => inspection.conflict);

const summarizeDryRun = (
  inspections: OperationInspection[],
): R011AGapSetupCommandValue => ({
  mode: "dry_run",
  createdCount: 0,
  noOpCount: 0,
  wouldCreateCount: inspections.filter((inspection) => !inspection.existing)
    .length,
  rollbackRequired: false,
  categories: inspections.map((inspection) => ({
    category: inspection.operation.category,
    status: inspection.existing ? "already_ready" : "would_create",
  })),
});

const summarizeRollback = (
  inspections: OperationInspection[],
): R011AGapSetupCommandValue => ({
  mode: "rollback_summary",
  createdCount: 0,
  noOpCount: inspections.filter((inspection) => inspection.existing).length,
  wouldCreateCount: 0,
  rollbackRequired: false,
  categories: inspections.map((inspection) => ({
    category: inspection.operation.category,
    status: inspection.existing
      ? "rollback_no_op_available"
      : "no_setup_record",
  })),
});

export const runR011AGapSetupCommand = async ({
  actor,
  audit,
  setupRepository,
  approvedScope,
  ownerApproval,
  input,
  idFactory = () => crypto.randomUUID(),
  nowFactory = () => new Date().toISOString(),
}: {
  actor: AuthorizationActor;
  audit: AuditSink;
  setupRepository: R011AGapSetupRepository;
  approvedScope: R011AApprovedScope;
  ownerApproval?: R011AOwnerApproval;
  input: unknown;
  idFactory?: () => string;
  nowFactory?: () => string;
}): Promise<R011AGapSetupCommandResult> => {
  const parsed = r011aGapSetupCommandSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  if (!hasR011AGapSetupManagementAuthority(actor)) {
    return appendDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: "management_authority_required",
    });
  }

  const request = parsed.data satisfies R011AGapSetupRequest;
  const plan = buildR011AGapSetupPlan({
    approvedScope,
    ownerApproval,
    request,
  });

  if (!plan.allowed) {
    return appendDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: plan.deniedReasons[0] ?? "owner_approval_missing",
    });
  }

  const inspections = await inspectOperations({
    setupRepository,
    actor,
    clientId: parsed.data.clientId,
    operations: plan.operations,
  });

  if (hasConflict(inspections)) {
    return appendDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: "idempotency_scope_mismatch",
    });
  }

  if (parsed.data.mode === "dry_run") {
    const value = summarizeDryRun(inspections);

    await audit.append({
      tenantId: actor.tenantId,
      clientId: parsed.data.clientId,
      actorUserId: actor.userId,
      action: "R011AGapSetupDryRunPreviewed",
      decision: "allowed",
      targetType: "r011a_gap_setup",
      targetId: parsed.data.clientId,
      metadata: {
        requestedCategoryCount: value.categories.length,
        wouldCreateCount: value.wouldCreateCount,
      },
    });

    return { ok: true, value };
  }

  if (parsed.data.mode === "rollback_summary") {
    const value = summarizeRollback(inspections);

    await audit.append({
      tenantId: actor.tenantId,
      clientId: parsed.data.clientId,
      actorUserId: actor.userId,
      action: "R011AGapSetupRollbackSummarized",
      decision: "allowed",
      targetType: "r011a_gap_setup",
      targetId: parsed.data.clientId,
      metadata: {
        requestedCategoryCount: value.categories.length,
        rollbackRequired: value.rollbackRequired,
      },
    });

    return { ok: true, value };
  }

  return runAuditAtomicMutation({
    transaction: createRequiredAuditAtomicUnitOfWork([setupRepository, audit]),
    operation: async () => {
      const occurredAt = nowFactory();
      const categories: R011AGapSetupCommandCategoryResult[] = [];
      let createdCount = 0;
      let noOpCount = 0;

      for (const inspection of inspections) {
        if (inspection.existing) {
          noOpCount += 1;
          categories.push({
            category: inspection.operation.category,
            status: "already_ready",
          });
          continue;
        }

        await setupRepository.create({
          id: idFactory(),
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          category: inspection.operation.category,
          operation: inspection.operation.operation,
          idempotencyKey: inspection.operation.idempotencyKey,
          createdBy: actor.userId,
          occurredAt,
        });
        createdCount += 1;
        categories.push({
          category: inspection.operation.category,
          status: "created",
        });

        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: inspection.operation.auditAction,
          decision: "allowed",
          targetType: "r011a_gap_setup_category",
          targetId: inspection.operation.category,
          reason: "local_setup_path_prepared",
          occurredAt,
        });
      }

      await audit.append({
        tenantId: actor.tenantId,
        clientId: parsed.data.clientId,
        actorUserId: actor.userId,
        action: "R011AGapSetupApplied",
        decision: "allowed",
        targetType: "r011a_gap_setup",
        targetId: parsed.data.clientId,
        reason: "local_only_no_hosted_mutation",
        occurredAt,
        metadata: {
          requestedCategoryCount: categories.length,
          createdCount,
          noOpCount,
          hostedMutationCount: 0,
          productionAcceptanceGranted: false,
        },
      });

      return {
        ok: true,
        value: {
          mode: "apply_local",
          createdCount,
          noOpCount,
          wouldCreateCount: 0,
          rollbackRequired: false,
          categories,
        },
      };
    },
  });
};
