import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { LocalInvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { resendInvitationCommand } from "@/server/commands/invitations/resend-invitation";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

describe("resend invitation command", () => {
  it("supersedes the old pending link before issuing a replacement", async () => {
    const audit = new InMemoryAuditSink();
    const dispatcher = new LocalInvitationEmailDispatcher();
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_old",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_old",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    const resent = await resendInvitationCommand({
      actor: tenantAdminA.authorizationActor,
      invitations,
      audit,
      dispatcher,
      input: { invitationId: "inv_old", idempotencyKey: "resend-old" },
      idFactory: () => "inv_new",
      tokenFactory: () => "token_new",
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(resent).toMatchObject({
      ok: true,
      value: { ok: true, value: { id: "inv_new", status: "pending" } },
    });
    expect((await invitations.findById("inv_old"))?.status).toBe("superseded");
    expect(dispatcher.sent.at(-1)).toMatchObject({ invitationId: "inv_new" });

    const oldLink = await acceptClientInvitationCommand({
      session: {
        userId: "client_viewer_a",
        email: "client-viewer-a@example.test",
      },
      invitationId: "inv_old",
      invitations,
      memberships: new InMemoryMembershipRepository(),
      audit,
      now: () => new Date("2026-06-24T10:00:00.000Z"),
    });

    expect(oldLink).toEqual({ ok: false, error: "INVITATION_SUPERSEDED" });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "InvitationSuperseded" }),
        expect.objectContaining({ action: "InvitationResent" }),
      ]),
    );
  });
});
