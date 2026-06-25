import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type { MembershipRepository } from "@/modules/memberships/membership-repository";
import { validateRoleAssignmentAuthority } from "@/modules/roles/role-assignment-rules";

const changeRoleAssignmentSchema = z.object({
  assignmentId: z.string().trim().min(1),
  membershipKind: z.enum(["tenant", "client"]),
  roleKey: z
    .enum([
      "tenant_owner",
      "tenant_administrator",
      "account_manager",
      "content_writer",
      "designer",
      "client_admin",
      "client_approver",
      "client_viewer",
    ])
    .optional(),
  scopeType: z.enum(["tenant", "client"]).optional(),
  scopeId: z.string().trim().min(1).optional(),
  status: z.enum(["active", "disabled", "removed"]).optional(),
  reason: z.string().trim().min(3).max(500),
});

export const changeRoleAssignmentCommand = async ({
  actor,
  memberships,
  audit,
  input,
}: {
  actor: AuthorizationActor;
  memberships: MembershipRepository;
  audit: AuditSink;
  input: unknown;
}) => {
  const parsed = changeRoleAssignmentSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const existing = await memberships.findRoleAssignmentById(
    parsed.data.assignmentId,
  );

  if (!existing || existing.tenantId !== actor.tenantId) {
    return { ok: false as const, error: "ROLE_ASSIGNMENT_DENIED" as const };
  }

  const targetMembership = await memberships.findMembershipById({
    membershipKind: parsed.data.membershipKind,
    membershipId: existing.membershipId,
  });

  if (!targetMembership) {
    return { ok: false as const, error: "ROLE_ASSIGNMENT_DENIED" as const };
  }

  const nextRoleKey = parsed.data.roleKey ?? existing.roleKey;
  const nextScopeType = parsed.data.scopeType ?? existing.scopeType;
  const nextScopeId = parsed.data.scopeId ?? existing.scopeId;
  const nextStatus = parsed.data.status ?? existing.status;

  const oldAuthority = validateRoleAssignmentAuthority({
    actor,
    targetMembership,
    membershipKind: parsed.data.membershipKind,
    roleKey: existing.roleKey,
    scopeType: existing.scopeType,
    scopeId: existing.scopeId,
  });
  const newAuthority = validateRoleAssignmentAuthority({
    actor,
    targetMembership,
    membershipKind: parsed.data.membershipKind,
    roleKey: nextRoleKey,
    scopeType: nextScopeType,
    scopeId: nextScopeId,
  });

  if (!oldAuthority.allowed || !newAuthority.allowed) {
    await audit.append({
      tenantId: actor.tenantId,
      clientId: nextScopeType === "client" ? nextScopeId : undefined,
      actorUserId: actor.userId,
      action: "RoleAssignmentDenied",
      decision: "denied",
      targetType: "role_assignment",
      targetId: existing.id,
      reason: !oldAuthority.allowed
        ? oldAuthority.reason
        : !newAuthority.allowed
          ? newAuthority.reason
          : undefined,
    });

    return { ok: false as const, error: "ROLE_ASSIGNMENT_DENIED" as const };
  }

  return runAuditAtomicMutation({
    transaction: createRequiredAuditAtomicUnitOfWork([audit, memberships]),
    operation: async () => {
      await audit.append({
        tenantId: actor.tenantId,
        clientId: nextScopeType === "client" ? nextScopeId : undefined,
        actorUserId: actor.userId,
        action: nextStatus === "removed" ? "RoleRevoked" : "RoleUpdated",
        decision: "allowed",
        targetType: "role_assignment",
        targetId: existing.id,
        reason: parsed.data.reason,
      });

      const updated = await memberships.updateRoleAssignment({
        assignmentId: existing.id,
        roleKey: nextRoleKey,
        scopeType: nextScopeType,
        scopeId: nextScopeId,
        status: nextStatus,
      });

      if (!updated) {
        throw new Error("ROLE_ASSIGNMENT_MUTATION_FAILED");
      }

      return { ok: true as const, value: updated };
    },
  });
};
