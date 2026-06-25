import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { revokeInvitationCommand } from "@/server/commands/invitations/revoke-invitation";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

describe("revoke invitation command", () => {
  it("revokes a pending invitation and denies the revoked link with audit", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_revoke",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_revoke",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    const revoked = await revokeInvitationCommand({
      actor: tenantAdminA.authorizationActor,
      invitations,
      audit,
      input: { invitationId: "inv_revoke", reason: "admin_cancelled" },
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(revoked).toMatchObject({
      ok: true,
      value: { ok: true, value: { status: "revoked" } },
    });

    const accepted = await acceptClientInvitationCommand({
      session: {
        userId: "client_viewer_a",
        email: "client-viewer-a@example.test",
      },
      invitationId: "inv_revoke",
      invitations,
      memberships: new InMemoryMembershipRepository(),
      audit,
      now: () => new Date("2026-06-24T10:00:00.000Z"),
    });

    expect(accepted).toEqual({ ok: false, error: "INVITATION_REVOKED" });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "InvitationRevoked" }),
        expect.objectContaining({
          action: "InvitationAcceptanceDenied",
          reason: "INVITATION_REVOKED",
        }),
      ]),
    );
  });
});
