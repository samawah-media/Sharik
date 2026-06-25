import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import type { InvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import {
  type InvitationRepository,
} from "@/modules/invitations/invitation-repository";
import {
  internalInvitationRoleKeys,
  validateInternalInvitationScope,
} from "@/modules/invitations/internal-invitation-rules";
import {
  allowAllRateLimiter,
  type RateLimiter,
} from "@/modules/security/rate-limit";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const inviteInternalMemberSchema = z.object({
  email: z.string().trim().email(),
  roleKey: z.enum(internalInvitationRoleKeys),
  clientIds: z.array(z.string().trim().min(1)).min(1),
  message: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const inviteInternalMemberCommand = async ({
  actor,
  clients,
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
  clients: ClientRepository;
  invitations: InvitationRepository;
  audit: AuditSink;
  dispatcher: InvitationEmailDispatcher;
  input: unknown;
  idFactory?: () => string;
  tokenFactory?: () => string;
  now?: () => Date;
  rateLimiter?: RateLimiter;
}) => {
  const parsed = inviteInternalMemberSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  const requestedAt = now();
  const rateLimit = await rateLimiter.check({
    key: `invite:${actor.userId}:${parsed.data.email.toLowerCase()}`,
    limit: 10,
    windowMs: 60_000,
    now: requestedAt,
  });

  if (!rateLimit.ok) {
    return { ok: false as const, error: "RATE_LIMITED" as const };
  }

  return runAuthorizedSensitiveOperation({
    actor,
    permission: PERMISSIONS.USER_INVITE,
    resource: { tenantId: actor.tenantId },
    audit,
    operation: async () => {
      const tenantClients = await clients.listByTenant(actor.tenantId);
      const scopeDecision = validateInternalInvitationScope({
        tenantId: actor.tenantId,
        roleKey: parsed.data.roleKey,
        clientIds: parsed.data.clientIds,
        clients: tenantClients,
      });

      if (!scopeDecision.ok) {
        await audit.append({
          tenantId: actor.tenantId,
          actorUserId: actor.userId,
          action: "InternalInvitationDenied",
          decision: "denied",
          targetType: "invitation",
          targetId: parsed.data.email.toLowerCase(),
          reason: scopeDecision.error,
        });

        return { ok: false as const, error: scopeDecision.error };
      }

      const existing = await invitations.findPendingInternalInvite({
        tenantId: actor.tenantId,
        invitedEmail: parsed.data.email,
        roleKey: parsed.data.roleKey,
        clientIds: scopeDecision.clientIds,
        idempotencyKey: parsed.data.idempotencyKey,
      });

      if (existing) {
        return { ok: true as const, value: existing };
      }

      return runAuditAtomicMutation({
        transaction: createRequiredAuditAtomicUnitOfWork([audit, invitations]),
        operation: async () => {
          const createdAt = requestedAt;
          const expiresAt = new Date(createdAt);
          expiresAt.setDate(expiresAt.getDate() + 7);

          const invitationId = idFactory();
          const invitationToken = tokenFactory();

          await audit.append({
            tenantId: actor.tenantId,
            clientId: scopeDecision.clientIds[0],
            actorUserId: actor.userId,
            action: "TenantMembershipInvited",
            decision: "allowed",
            targetType: "invitation",
            targetId: invitationId,
          });
          await audit.append({
            tenantId: actor.tenantId,
            clientId: scopeDecision.clientIds[0],
            actorUserId: actor.userId,
            action: "RoleAssigned",
            decision: "allowed",
            targetType: "role_assignment_intent",
            targetId: `${invitationId}:${parsed.data.roleKey}`,
            reason: "intent_pending_acceptance",
          });

          const invitation = await invitations.create({
            id: invitationId,
            tenantId: actor.tenantId,
            invitedEmail: parsed.data.email,
            membershipType: "internal",
            roleKey: parsed.data.roleKey,
            clientIds: scopeDecision.clientIds,
            token: invitationToken,
            expiresAt: expiresAt.toISOString(),
            createdBy: actor.userId,
            deliveryState: "queued",
            idempotencyKey: parsed.data.idempotencyKey,
          });

          const delivery = await dispatcher.sendInternalInvitation(invitation);
          const delivered = await invitations.markDeliveryState(
            invitation.id,
            delivery.ok ? "sent" : "failed",
          );

          return { ok: true as const, value: delivered ?? invitation };
        },
      });
    },
  });
};
