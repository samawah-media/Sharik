import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type { MembershipRepository } from "@/modules/memberships/membership-repository";
import { validateRoleAssignmentAuthority } from "@/modules/roles/role-assignment-rules";

const assignRoleSchema = z.object({
  membershipKind: z.enum(["tenant", "client"]),
  membershipId: z.string().trim().min(1),
  roleKey: z.enum([
    "tenant_owner",
    "tenant_administrator",
    "account_manager",
    "content_writer",
    "designer",
    "client_admin",
    "client_approver",
    "client_viewer",
  ]),
  scopeType: z.enum(["tenant", "client"]),
  scopeId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(500),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const assignRoleCommand = async ({
  actor,
  memberships,
  audit,
  input,
  idFactory = () => crypto.randomUUID(),
}: {
  actor: AuthorizationActor;
  memberships: MembershipRepository;
  audit: AuditSink;
  input: unknown;
  idFactory?: () => string;
}) => {
  const parsed = assignRoleSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const targetMembership = await memberships.findMembershipById({
    membershipKind: parsed.data.membershipKind,
    membershipId: parsed.data.membershipId,
  });

  if (!targetMembership || targetMembership.tenantId !== actor.tenantId) {
    await audit.append({
      tenantId: actor.tenantId,
      clientId:
        parsed.data.scopeType === "client" ? parsed.data.scopeId : undefined,
      actorUserId: actor.userId,
      action: "RoleAssignmentDenied",
      decision: "denied",
      targetType: "membership",
      targetId: parsed.data.membershipId,
      reason: "scope_mismatch",
    });

    return { ok: false as const, error: "ROLE_ASSIGNMENT_DENIED" as const };
  }

  const authority = validateRoleAssignmentAuthority({
    actor,
    targetMembership,
    membershipKind: parsed.data.membershipKind,
    roleKey: parsed.data.roleKey,
    scopeType: parsed.data.scopeType,
    scopeId: parsed.data.scopeId,
  });

  if (!authority.allowed) {
    await audit.append({
      tenantId: actor.tenantId,
      clientId:
        parsed.data.scopeType === "client" ? parsed.data.scopeId : undefined,
      actorUserId: actor.userId,
      action: "RoleAssignmentDenied",
      decision: "denied",
      targetType: "membership",
      targetId: parsed.data.membershipId,
      reason: authority.reason,
    });

    return {
      ok: false as const,
      error:
        authority.reason === "membership_inactive"
          ? ("MEMBERSHIP_DISABLED" as const)
          : ("ROLE_ASSIGNMENT_DENIED" as const),
    };
  }

  const assignmentId = idFactory();

  return runAuditAtomicMutation({
    transaction: createRequiredAuditAtomicUnitOfWork([audit, memberships]),
    operation: async () => {
      await audit.append({
        tenantId: actor.tenantId,
        clientId:
          parsed.data.scopeType === "client" ? parsed.data.scopeId : undefined,
        actorUserId: actor.userId,
        action: "RoleAssigned",
        decision: "allowed",
        targetType: "role_assignment",
        targetId: assignmentId,
        reason: parsed.data.reason,
      });

      const assignment = await memberships.assignRole({
        id: assignmentId,
        tenantId: actor.tenantId,
        membershipId: parsed.data.membershipId,
        roleKey: parsed.data.roleKey,
        scopeType: parsed.data.scopeType,
        scopeId: parsed.data.scopeId,
      });

      return { ok: true as const, value: assignment };
    },
  });
};
