import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryInvitationRepository, type InvitationStatus } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

const invitation = ({
  id,
  status,
  expiresAt = "2026-07-01T08:00:00.000Z",
  acceptedBy,
}: {
  id: string;
  status: InvitationStatus;
  expiresAt?: string;
  acceptedBy?: string;
}) => ({
  id,
  tenantId: clientA.tenantId,
  invitedEmail: "client-viewer-a@example.test",
  membershipType: "client" as const,
  roleKey: "client_viewer" as const,
  clientIds: [clientA.id],
  status,
  token: `token_${id}`,
  expiresAt,
  createdBy: tenantAdminA.session.userId,
  createdAt: "2026-06-24T08:00:00.000Z",
  acceptedBy,
  acceptedAt: acceptedBy ? "2026-06-24T09:00:00.000Z" : undefined,
  deliveryState: "sent" as const,
});

describe("invitation denial audit coverage", () => {
  it.each([
    ["inv_expired", "pending", "INVITATION_EXPIRED"],
    ["inv_revoked", "revoked", "INVITATION_REVOKED"],
    ["inv_superseded", "superseded", "INVITATION_SUPERSEDED"],
    ["inv_used", "accepted", "INVITATION_ALREADY_USED"],
  ] as const)("audits %s denial as %s", async (id, status, reason) => {
    const audit = new InMemoryAuditSink();
    const result = await acceptClientInvitationCommand({
      session: {
        userId: status === "accepted" ? "other_user" : "client_viewer_a",
        email: "client-viewer-a@example.test",
      },
      invitationId: id,
      invitations: new InMemoryInvitationRepository([
        invitation({
          id,
          status,
          expiresAt:
            reason === "INVITATION_EXPIRED"
              ? "2026-06-24T08:00:00.000Z"
              : "2026-07-01T08:00:00.000Z",
          acceptedBy: status === "accepted" ? "client_viewer_a" : undefined,
        }),
      ]),
      memberships: new InMemoryMembershipRepository(),
      audit,
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toEqual({ ok: false, error: reason });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "InvitationAcceptanceDenied",
        reason,
        targetId: id,
      }),
    );
  });

  it("audits email mismatch denial", async () => {
    const audit = new InMemoryAuditSink();
    const result = await acceptClientInvitationCommand({
      session: { userId: "wrong_user", email: "wrong@example.test" },
      invitationId: "inv_email_mismatch",
      invitations: new InMemoryInvitationRepository([
        invitation({ id: "inv_email_mismatch", status: "pending" }),
      ]),
      memberships: new InMemoryMembershipRepository(),
      audit,
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toEqual({ ok: false, error: "EMAIL_MISMATCH" });
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "InvitationAcceptanceDenied",
        reason: "EMAIL_MISMATCH",
      }),
    );
  });
});
