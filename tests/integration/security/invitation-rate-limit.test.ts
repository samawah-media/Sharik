import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryClientRepository } from "@/modules/clients/client-repository";
import { LocalInvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { InMemoryRateLimiter } from "@/modules/security/rate-limit";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { inviteClientMemberCommand } from "@/server/commands/invitations/invite-client-member";
import { resendInvitationCommand } from "@/server/commands/invitations/resend-invitation";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

const seededClients = () =>
  new InMemoryClientRepository([
    {
      id: clientA.id,
      tenantId: clientA.tenantId,
      name: clientA.name,
      slug: "client-a",
      status: "active",
      createdBy: tenantAdminA.session.userId,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      revision: 1,
    },
  ]);

describe("invitation rate limiting", () => {
  it("throttles invitation creation safely", async () => {
    const limiter = new InMemoryRateLimiter();
    const first = await inviteClientMemberCommand({
      actor: tenantAdminA.authorizationActor,
      clients: seededClients(),
      invitations: new InMemoryInvitationRepository(),
      audit: new InMemoryAuditSink(),
      dispatcher: new LocalInvitationEmailDispatcher(),
      input: {
        email: "client-viewer-a@example.test",
        roleKey: "client_viewer",
        clientId: clientA.id,
      },
      now: () => new Date("2026-06-24T09:00:00.000Z"),
      rateLimiter: limiter,
    });
    const second = await inviteClientMemberCommand({
      actor: tenantAdminA.authorizationActor,
      clients: seededClients(),
      invitations: new InMemoryInvitationRepository(),
      audit: new InMemoryAuditSink(),
      dispatcher: new LocalInvitationEmailDispatcher(),
      input: {
        email: "client-viewer-a@example.test",
        roleKey: "client_viewer",
        clientId: clientA.id,
      },
      now: () => new Date("2026-06-24T09:00:00.001Z"),
      rateLimiter: {
        check: (input) => limiter.check({ ...input, limit: 1 }),
      },
    });

    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, error: "RATE_LIMITED" });
  });

  it("throttles resend and accept attempts without revealing token state", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_rate",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_rate",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);
    const denyLimiter = {
      check: async () =>
        ({ ok: false, error: "RATE_LIMITED", retryAfterSeconds: 60 }) as const,
    };

    await expect(
      resendInvitationCommand({
        actor: tenantAdminA.authorizationActor,
        invitations,
        audit,
        dispatcher: new LocalInvitationEmailDispatcher(),
        input: { invitationId: "inv_rate" },
        rateLimiter: denyLimiter,
      }),
    ).resolves.toEqual({ ok: false, error: "RATE_LIMITED" });

    await expect(
      acceptClientInvitationCommand({
        session: {
          userId: "client_viewer_a",
          email: "client-viewer-a@example.test",
        },
        invitationId: "inv_rate",
        invitations,
        memberships: new InMemoryMembershipRepository(),
        audit,
        rateLimiter: denyLimiter,
      }),
    ).resolves.toEqual({ ok: false, error: "RATE_LIMITED" });
  });
});
