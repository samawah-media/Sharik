import { describe, expect, it } from "vitest";
import { evaluateInvitationAcceptance } from "@/modules/invitations/invitation-state-machine";
import type { InvitationRecord } from "@/modules/invitations/invitation-repository";
import { clientA } from "../../fixtures/f001-fixtures";

const baseInvitation: InvitationRecord = {
  id: "inv_used",
  tenantId: clientA.tenantId,
  invitedEmail: "client-viewer-a@example.test",
  membershipType: "client",
  roleKey: "client_viewer",
  clientIds: [clientA.id],
  status: "accepted",
  token: "token_used",
  expiresAt: "2026-07-01T08:00:00.000Z",
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-24T08:00:00.000Z",
  acceptedBy: "client_viewer_a",
  acceptedAt: "2026-06-24T09:00:00.000Z",
  deliveryState: "sent",
};

describe("invitation single-use and idempotency", () => {
  it("allows the same accepting user to refresh an accepted invite as an idempotent no-op", () => {
    expect(
      evaluateInvitationAcceptance({
        invitation: baseInvitation,
        acceptingEmail: "client-viewer-a@example.test",
        acceptingUserId: "client_viewer_a",
        now: new Date("2026-06-24T10:00:00.000Z"),
      }),
    ).toEqual({ ok: true, idempotent: true });
  });

  it("denies replay by a different user without granting duplicate access", () => {
    expect(
      evaluateInvitationAcceptance({
        invitation: baseInvitation,
        acceptingEmail: "client-viewer-a@example.test",
        acceptingUserId: "other_user",
        now: new Date("2026-06-24T10:00:00.000Z"),
      }),
    ).toEqual({ ok: false, error: "INVITATION_ALREADY_USED" });
  });
});
