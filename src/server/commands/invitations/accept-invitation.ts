import {
  runAuditAtomicMutation,
  createRequiredAuditAtomicUnitOfWork,
  type AuditSink,
} from "@/modules/audit/audit-service";
import type { AuthSession } from "@/modules/auth/session";
import {
  evaluateInvitationAcceptance,
  type InvitationLifecycleError,
} from "@/modules/invitations/invitation-state-machine";
import type { InvitationRepository } from "@/modules/invitations/invitation-repository";
import type { MembershipRepository } from "@/modules/memberships/membership-repository";
import {
  allowAllRateLimiter,
  type RateLimiter,
} from "@/modules/security/rate-limit";

const auditInvitationDenial = async ({
  audit,
  tenantId,
  clientId,
  actorUserId,
  invitationId,
  reason,
}: {
  audit: AuditSink;
  tenantId: string;
  clientId?: string;
  actorUserId: string;
  invitationId: string;
  reason: InvitationLifecycleError | "VALIDATION_FAILED" | "RATE_LIMITED";
}) =>
  audit.append({
    tenantId,
    clientId,
    actorUserId,
    action: "InvitationAcceptanceDenied",
    decision: "denied",
    targetType: "invitation",
    targetId: invitationId,
    reason,
  });

export const acceptInternalInvitationCommand = async ({
  session,
  invitationId,
  invitations,
  memberships,
  audit,
  membershipIdFactory = () => crypto.randomUUID(),
  roleAssignmentIdFactory = () => crypto.randomUUID(),
  now = () => new Date(),
  rateLimiter = allowAllRateLimiter,
}: {
  session: AuthSession;
  invitationId: string;
  invitations: InvitationRepository;
  memberships: MembershipRepository;
  audit: AuditSink;
  membershipIdFactory?: () => string;
  roleAssignmentIdFactory?: () => string;
  now?: () => Date;
  rateLimiter?: RateLimiter;
}) => {
  const acceptedAt = now();
  const rateLimit = await rateLimiter.check({
    key: `accept:${invitationId}:${session.userId}`,
    limit: 10,
    windowMs: 60_000,
    now: acceptedAt,
  });

  if (!rateLimit.ok) {
    return { ok: false as const, error: "RATE_LIMITED" as const };
  }

  const invitation = await invitations.findById(invitationId);

  if (!invitation || invitation.membershipType !== "internal") {
    return { ok: false as const, error: "INVITATION_NOT_FOUND" as const };
  }

  const decision = evaluateInvitationAcceptance({
    invitation,
    acceptingEmail: session.email,
    acceptingUserId: session.userId,
    now: acceptedAt,
  });

  if (decision.ok && decision.idempotent) {
    return { ok: true as const, value: invitation, idempotent: true as const };
  }

  if (!decision.ok) {
    await auditInvitationDenial({
      audit,
      tenantId: invitation.tenantId,
      actorUserId: session.userId,
      invitationId: invitation.id,
      reason: decision.error,
    });

    return { ok: false as const, error: decision.error };
  }

  return runAuditAtomicMutation({
    transaction: createRequiredAuditAtomicUnitOfWork([audit, invitations, memberships]),
    operation: async () => {
      const tenantMembershipId = membershipIdFactory();
      const roleAssignmentIds = invitation.clientIds.map(() =>
        roleAssignmentIdFactory(),
      );

      await audit.append({
        tenantId: invitation.tenantId,
        clientId: invitation.clientIds[0],
        actorUserId: session.userId,
        action: "TenantMembershipActivated",
        decision: "allowed",
        targetType: "tenant_membership",
        targetId: tenantMembershipId,
      });
      await audit.append({
        tenantId: invitation.tenantId,
        clientId: invitation.clientIds[0],
        actorUserId: session.userId,
        action: "InvitationAccepted",
        decision: "allowed",
        targetType: "invitation",
        targetId: invitation.id,
      });

      const tenantMembership = await memberships.activateTenantMembership({
        id: tenantMembershipId,
        tenantId: invitation.tenantId,
        userId: session.userId,
      });

      const roleAssignments = [];

      for (const [index, clientId] of invitation.clientIds.entries()) {
        roleAssignments.push(
          await memberships.assignRole({
            id: roleAssignmentIds[index],
            tenantId: invitation.tenantId,
            membershipId: tenantMembership.id,
            roleKey: invitation.roleKey,
            scopeType: "client",
            scopeId: clientId,
          }),
        );
      }

      const accepted = await invitations.accept({
        invitationId: invitation.id,
        acceptedBy: session.userId,
        acceptedAt: acceptedAt.toISOString(),
      });

      if (!accepted) {
        throw new Error("INVITATION_ACCEPT_FAILED");
      }

      return {
        ok: true as const,
        value: {
          invitation: accepted,
          tenantMembership,
          roleAssignments,
        },
      };
    },
  });
};

export const acceptClientInvitationCommand = async ({
  session,
  invitationId,
  invitations,
  memberships,
  audit,
  membershipIdFactory = () => crypto.randomUUID(),
  roleAssignmentIdFactory = () => crypto.randomUUID(),
  now = () => new Date(),
  rateLimiter = allowAllRateLimiter,
}: {
  session: AuthSession;
  invitationId: string;
  invitations: InvitationRepository;
  memberships: MembershipRepository;
  audit: AuditSink;
  membershipIdFactory?: () => string;
  roleAssignmentIdFactory?: () => string;
  now?: () => Date;
  rateLimiter?: RateLimiter;
}) => {
  const acceptedAt = now();
  const rateLimit = await rateLimiter.check({
    key: `accept:${invitationId}:${session.userId}`,
    limit: 10,
    windowMs: 60_000,
    now: acceptedAt,
  });

  if (!rateLimit.ok) {
    return { ok: false as const, error: "RATE_LIMITED" as const };
  }

  const invitation = await invitations.findById(invitationId);

  if (!invitation || invitation.membershipType !== "client") {
    return { ok: false as const, error: "INVITATION_NOT_FOUND" as const };
  }

  const decision = evaluateInvitationAcceptance({
    invitation,
    acceptingEmail: session.email,
    acceptingUserId: session.userId,
    now: acceptedAt,
  });

  if (decision.ok && decision.idempotent) {
    return { ok: true as const, value: invitation, idempotent: true as const };
  }

  if (!decision.ok) {
    await auditInvitationDenial({
      audit,
      tenantId: invitation.tenantId,
      clientId: invitation.clientIds[0],
      actorUserId: session.userId,
      invitationId: invitation.id,
      reason: decision.error,
    });

    return { ok: false as const, error: decision.error };
  }

  const [clientId] = invitation.clientIds;

  if (!clientId || invitation.clientIds.length !== 1) {
    await auditInvitationDenial({
      audit,
      tenantId: invitation.tenantId,
      clientId,
      actorUserId: session.userId,
      invitationId: invitation.id,
      reason: "VALIDATION_FAILED",
    });

    return { ok: false as const, error: "VALIDATION_FAILED" as const };
  }

  return runAuditAtomicMutation({
    transaction: createRequiredAuditAtomicUnitOfWork([audit, invitations, memberships]),
    operation: async () => {
      const clientMembershipId = membershipIdFactory();
      const roleAssignmentId = roleAssignmentIdFactory();

      await audit.append({
        tenantId: invitation.tenantId,
        clientId,
        actorUserId: session.userId,
        action: "ClientMembershipActivated",
        decision: "allowed",
        targetType: "client_membership",
        targetId: clientMembershipId,
      });
      await audit.append({
        tenantId: invitation.tenantId,
        clientId,
        actorUserId: session.userId,
        action: "InvitationAccepted",
        decision: "allowed",
        targetType: "invitation",
        targetId: invitation.id,
      });

      const clientMembership = await memberships.activateClientMembership({
        id: clientMembershipId,
        tenantId: invitation.tenantId,
        clientId,
        userId: session.userId,
      });

      const roleAssignment = await memberships.assignRole({
        id: roleAssignmentId,
        tenantId: invitation.tenantId,
        membershipId: clientMembership.id,
        roleKey: invitation.roleKey,
        scopeType: "client",
        scopeId: clientId,
      });

      const accepted = await invitations.accept({
        invitationId: invitation.id,
        acceptedBy: session.userId,
        acceptedAt: acceptedAt.toISOString(),
      });

      if (!accepted) {
        throw new Error("INVITATION_ACCEPT_FAILED");
      }

      return {
        ok: true as const,
        value: {
          invitation: accepted,
          clientMembership,
          roleAssignments: [roleAssignment],
        },
      };
    },
  });
};
