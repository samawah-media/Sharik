import { z } from "zod";
import type { AuditSink } from "@/modules/audit/audit-service";
import {
  evaluatePermission,
  type AuthorizationActor,
} from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { DeliverableRepository } from "@/modules/deliverables/deliverable-repository";
import { safeDeniedError } from "@/modules/errors/safe-errors";
import { isActive, type RoleKey } from "@/modules/memberships/membership";
import { toManagementSlaSummary } from "@/modules/sla/sla-summary";

const managementRoleKeys = new Set<RoleKey>([
  "tenant_owner",
  "tenant_administrator",
  "account_manager",
]);

const listManagementSlaSummariesSchema = z.object({
  clientId: z.string().trim().min(1),
});

const hasManagementScope = ({
  actor,
  clientId,
}: {
  actor: AuthorizationActor;
  clientId: string;
}) => {
  if (!isActive(actor.tenantMembership.status)) {
    return false;
  }

  return actor.roleAssignments.some((assignment) => {
    if (
      !isActive(assignment.status) ||
      assignment.tenantId !== actor.tenantId ||
      !managementRoleKeys.has(assignment.roleKey)
    ) {
      return false;
    }

    if (assignment.scopeType === "tenant") {
      return assignment.scopeId === actor.tenantId;
    }

    return assignment.scopeId === clientId;
  });
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
  reason: string;
}) => {
  await audit.append({
    tenantId: actor.tenantId,
    clientId,
    actorUserId: actor.userId,
    action: "SlaSummaryReadDenied",
    decision: "denied",
    targetType: "sla_summary",
    targetId: clientId,
    reason,
  });

  return { ok: false as const, error: safeDeniedError("ACCESS_DENIED") };
};

export const listManagementSlaSummariesCommand = async ({
  actor,
  deliverables,
  audit,
  input,
  now = new Date(),
}: {
  actor: AuthorizationActor;
  deliverables: DeliverableRepository;
  audit: AuditSink;
  input: unknown;
  now?: string | Date;
}) => {
  const parsed = listManagementSlaSummariesSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const permissionDecision = evaluatePermission({
    actor,
    permission: PERMISSIONS.CONTRACT_VIEW,
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
  });

  if (!permissionDecision.allowed) {
    return appendDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: permissionDecision.reason,
    });
  }

  if (!hasManagementScope({ actor, clientId: parsed.data.clientId })) {
    return appendDeniedAudit({
      audit,
      actor,
      clientId: parsed.data.clientId,
      reason: "management_scope_required",
    });
  }

  const scopedDeliverables = await deliverables.listByTenantClient(
    actor.tenantId,
    parsed.data.clientId,
  );

  return {
    ok: true as const,
    value: scopedDeliverables.map((deliverable) =>
      toManagementSlaSummary({ deliverable, now }),
    ),
  };
};
