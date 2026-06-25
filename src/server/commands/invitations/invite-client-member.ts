import { z } from "zod";
import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import type { ClientRepository } from "@/modules/clients/client-repository";
import {
  clientInvitationRoleKeys,
  validateClientInvitationScope,
} from "@/modules/invitations/client-invitation-rules";
import type { InvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import type { InvitationRepository } from "@/modules/invitations/invitation-repository";
import {
  allowAllRateLimiter,
  type RateLimiter,
} from "@/modules/security/rate-limit";
import { runAuthorizedSensitiveOperation } from "@/server/authorization/server-authorization";

const inviteClientMemberSchema = z.object({
  email: z.string().trim().email(),
  roleKey: z.enum(clientInvitationRoleKeys),
  clientId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const inviteClientMemberCommand = async ({
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
  const parsed = inviteClientMemberSchema.safeParse(input);

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
    resource: { tenantId: actor.tenantId, clientId: parsed.data.clientId },
    audit,
    operation: async () => {
      const tenantClients = await clients.listByTenant(actor.tenantId);
      const scopeDecision = validateClientInvitationScope({
        tenantId: actor.tenantId,
        roleKey: parsed.data.roleKey,
        clientIds: [parsed.data.clientId],
        clients: tenantClients,
      });

      if (!scopeDecision.ok) {
        await audit.append({
          tenantId: actor.tenantId,
          clientId: parsed.data.clientId,
          actorUserId: actor.userId,
          action: "ClientInvitationDenied",
          decision: "denied",
          targetType: "invitation",
          targetId: parsed.data.email.toLowerCase(),
          reason: scopeDecision.error,
        });

        return { ok: false as const, error: scopeDecision.error };
      }

      const existing = await invitations.findPendingClientInvite({
        tenantId: actor.tenantId,
        invitedEmail: parsed.data.email,
        roleKey: parsed.data.roleKey,
        clientId: scopeDecision.clientId,
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
            clientId: scopeDecision.clientId,
            actorUserId: actor.userId,
            action: "ClientMemberInvited",
            decision: "allowed",
            targetType: "invitation",
            targetId: invitationId,
          });
          await audit.append({
            tenantId: actor.tenantId,
            clientId: scopeDecision.clientId,
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
            membershipType: "client",
            roleKey: parsed.data.roleKey,
            clientIds: [scopeDecision.clientId],
            token: invitationToken,
            expiresAt: expiresAt.toISOString(),
            createdBy: actor.userId,
            deliveryState: "queued",
            idempotencyKey: parsed.data.idempotencyKey,
          });

          const delivery = await dispatcher.sendClientInvitation(invitation);
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
