import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { InvitationRepository } from "@/modules/invitations/invitation-repository";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const revokeInvitationSchema = z.object({
  invitationId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

export const revokeInvitationCommand = async ({
  actor,
  invitations,
  audit,
  input,
  now = () => new Date(),
}: {
  actor: AuthorizationActor;
  invitations: InvitationRepository;
  audit: AuditSink;
  input: unknown;
  now?: () => Date;
}) => {
  const parsed = revokeInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const invitation = await invitations.findById(parsed.data.invitationId);

  if (!invitation || invitation.tenantId !== actor.tenantId) {
    return { ok: false as const, error: "INVITATION_NOT_FOUND" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.USER_INVITE,
    resource: {
      tenantId: invitation.tenantId,
      clientId: invitation.clientIds[0],
    },
    audit,
    operation: async () => {
      if (invitation.status !== "pending" && invitation.status !== "revoked") {
        return {
          ok: false as const,
          error:
            invitation.status === "accepted"
              ? ("INVITATION_ALREADY_USED" as const)
              : ("INVITATION_NOT_FOUND" as const),
        };
      }

      return runAuditAtomicMutation({
        transaction: createRequiredAuditAtomicUnitOfWork([audit, invitations]),
        operation: async () => {
          await audit.append({
            tenantId: invitation.tenantId,
            clientId: invitation.clientIds[0],
            actorUserId: actor.userId,
            action: "InvitationRevoked",
            decision: "allowed",
            targetType: "invitation",
            targetId: invitation.id,
            reason: parsed.data.reason,
          });

          const revoked = await invitations.revoke({
            invitationId: invitation.id,
            revokedBy: actor.userId,
            revokedAt: now().toISOString(),
          });

          if (!revoked) {
            throw new Error("INVITATION_REVOKE_FAILED");
          }

          return { ok: true as const, value: revoked };
        },
      });
    },
  });
};
