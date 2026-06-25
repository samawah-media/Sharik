import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

describe("invitation email mismatch and missing token safety", () => {
  it("denies mismatched email without activating membership", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new InMemoryMembershipRepository();
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_mismatch",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_mismatch",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    const result = await acceptClientInvitationCommand({
      session: { userId: "wrong_user", email: "wrong@example.test" },
      invitationId: "inv_mismatch",
      invitations,
      memberships,
      audit,
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toEqual({ ok: false, error: "EMAIL_MISMATCH" });
    expect(await memberships.listClientMemberships(clientA.tenantId)).toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "InvitationAcceptanceDenied",
        reason: "EMAIL_MISMATCH",
      }),
    );
  });

  it("returns not found for unknown invitation without leaking scope data", async () => {
    const result = await acceptClientInvitationCommand({
      session: { userId: "unknown", email: "unknown@example.test" },
      invitationId: "missing_invitation",
      invitations: new InMemoryInvitationRepository(),
      memberships: new InMemoryMembershipRepository(),
      audit: new InMemoryAuditSink(),
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toEqual({ ok: false, error: "INVITATION_NOT_FOUND" });
  });
});
