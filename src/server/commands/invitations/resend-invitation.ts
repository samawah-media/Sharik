import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { InvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import type { InvitationRepository } from "@/modules/invitations/invitation-repository";
import {
  allowAllRateLimiter,
  type RateLimiter,
} from "@/modules/security/rate-limit";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const resendInvitationSchema = z.object({
  invitationId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const resendInvitationCommand = async ({
  actor,
  invitations,
  audit,
  dispatcher,
  input,
  idFactory = () => crypto.randomUUID(),
  tokenFactory = () => crypto.randomUUID(),
  now = () => new Date(),
  rateLimiter = allowAllRateLimiter,
}: {
  actor: AuthorizationActor;
  invitations: InvitationRepository;
  audit: AuditSink;
  dispatcher: InvitationEmailDispatcher;
  input: unknown;
  idFactory?: () => string;
  tokenFactory?: () => string;
  now?: () => Date;
  rateLimiter?: RateLimiter;
}) => {
  const parsed = resendInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const requestedAt = now();
  const rateLimit = await rateLimiter.check({
    key: `resend:${actor.userId}:${parsed.data.invitationId}`,
    limit: 5,
    windowMs: 60_000,
    now: requestedAt,
  });

  if (!rateLimit.ok) {
    return { ok: false as const, error: "RATE_LIMITED" as const };
  }

  const invitation = await invitations.findById(parsed.data.invitationId);

  if (!invitation || invitation.tenantId !== actor.tenantId) {
    return { ok: false as const, error: "INVITATION_NOT_FOUND" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.USER_INVITE_RESEND,
    resource: {
      tenantId: invitation.tenantId,
      clientId: invitation.clientIds[0],
    },
    audit,
    operation: async () => {
      if (invitation.status !== "pending") {
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
          const expiresAt = new Date(requestedAt);
          expiresAt.setDate(expiresAt.getDate() + 7);
          const replacementId = idFactory();
          const replacementToken = tokenFactory();

          await audit.append({
            tenantId: invitation.tenantId,
            clientId: invitation.clientIds[0],
            actorUserId: actor.userId,
            action: "InvitationSuperseded",
            decision: "allowed",
            targetType: "invitation",
            targetId: invitation.id,
          });
          await audit.append({
            tenantId: invitation.tenantId,
            clientId: invitation.clientIds[0],
            actorUserId: actor.userId,
            action: "InvitationResent",
            decision: "allowed",
            targetType: "invitation",
            targetId: replacementId,
          });

          const superseded = await invitations.supersede({
            invitationId: invitation.id,
            supersededBy: actor.userId,
            supersededAt: requestedAt.toISOString(),
          });

          if (!superseded) {
            throw new Error("INVITATION_SUPERSEDE_FAILED");
          }

          const replacement = await invitations.create({
            id: replacementId,
            tenantId: invitation.tenantId,
            invitedEmail: invitation.invitedEmail,
            membershipType: invitation.membershipType,
            roleKey: invitation.roleKey,
            clientIds: invitation.clientIds,
            token: replacementToken,
            expiresAt: expiresAt.toISOString(),
            createdBy: actor.userId,
            deliveryState: "queued",
            idempotencyKey: parsed.data.idempotencyKey,
          });

          const delivery =
            replacement.membershipType === "internal"
              ? await dispatcher.sendInternalInvitation(replacement)
              : await dispatcher.sendClientInvitation(replacement);
          const delivered = await invitations.markDeliveryState(
            replacement.id,
            delivery.ok ? "sent" : "failed",
          );

          return { ok: true as const, value: delivered ?? replacement };
        },
      });
    },
  });
};
