import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { InvitationRepository } from "@/modules/invitations/invitation-repository";
import type { MembershipRepository } from "@/modules/memberships/membership-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const disableMembershipSchema = z.object({
  membershipKind: z.enum(["tenant", "client"]),
  membershipId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(500),
  invitedEmail: z.string().trim().email().optional(),
  hasActiveResponsibilities: z.boolean().default(false),
  responsibilityTransferStatus: z
    .enum(["not_required", "resolved", "blocked"])
    .default("not_required"),
});

export const disableMembershipCommand = async ({
  actor,
  memberships,
  invitations,
  audit,
  input,
  now = () => new Date(),
}: {
  actor: AuthorizationActor;
  memberships: MembershipRepository;
  invitations: InvitationRepository;
  audit: AuditSink;
  input: unknown;
  now?: () => Date;
}) => {
  const parsed = disableMembershipSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  if (
    parsed.data.hasActiveResponsibilities &&
    parsed.data.responsibilityTransferStatus !== "resolved"
  ) {
    await audit.append({
      tenantId: actor.tenantId,
      actorUserId: actor.userId,
      action: "MembershipSuspensionBlocked",
      decision: "denied",
      targetType: "membership",
      targetId: parsed.data.membershipId,
      reason: "responsibility_transfer_required",
    });

    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.USER_SUSPEND,
    resource: { tenantId: actor.tenantId },
    audit,
    operation: async () => {
      const target = await memberships.findMembershipById({
        membershipKind: parsed.data.membershipKind,
        membershipId: parsed.data.membershipId,
      });

      if (!target || target.tenantId !== actor.tenantId) {
        return { ok: false as const, error: "PERMISSION_DENIED" as const };
      }

      return runAuditAtomicMutation({
        transaction: createRequiredAuditAtomicUnitOfWork([audit, memberships, invitations]),
        operation: async () => {
          const pendingInvitations = parsed.data.invitedEmail
        ? (await invitations.listByTenant(actor.tenantId)).filter(
            (invitation) =>
              invitation.invitedEmail ===
                parsed.data.invitedEmail?.toLowerCase() &&
              invitation.status === "pending",
          )
        : [];
      const activeRoleAssignments = (
        await memberships.listRoleAssignments(actor.tenantId)
      ).filter(
        (assignment) =>
          assignment.membershipId === parsed.data.membershipId &&
          assignment.status === "active",
      );

          await audit.append({
            tenantId: actor.tenantId,
            actorUserId: actor.userId,
            action: "MembershipSuspended",
            decision: "allowed",
            targetType: `${parsed.data.membershipKind}_membership`,
            targetId: target.id,
            reason: parsed.data.reason,
          });

          for (const assignment of activeRoleAssignments) {
            await audit.append({
              tenantId: actor.tenantId,
              clientId:
                assignment.scopeType === "client" ? assignment.scopeId : undefined,
              actorUserId: actor.userId,
              action: "RoleRevoked",
              decision: "allowed",
              targetType: "role_assignment",
              targetId: assignment.id,
              reason: "membership_disabled",
            });
          }

          for (const invitation of pendingInvitations) {
            await audit.append({
              tenantId: actor.tenantId,
              clientId: invitation.clientIds[0],
              actorUserId: actor.userId,
              action: "InvitationRevoked",
              decision: "allowed",
              targetType: "invitation",
              targetId: invitation.id,
              reason: "membership_disabled",
            });
          }

          const disabled = await memberships.disableMembership({
            membershipKind: parsed.data.membershipKind,
            membershipId: parsed.data.membershipId,
          });
          const revokedAssignments =
            await memberships.revokeRoleAssignmentsForMembership({
              tenantId: actor.tenantId,
              membershipId: parsed.data.membershipId,
            });
          const revokedInvitations = parsed.data.invitedEmail
            ? await invitations.revokePendingForEmail({
                tenantId: actor.tenantId,
                invitedEmail: parsed.data.invitedEmail,
                revokedBy: actor.userId,
                revokedAt: now().toISOString(),
              })
            : [];

          if (!disabled) {
            throw new Error("MEMBERSHIP_DISABLE_FAILED");
          }

          return {
            ok: true as const,
            value: { disabled, revokedAssignments, revokedInvitations },
          };
        },
      });
    },
  });
};
