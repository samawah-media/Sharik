import { describe, expect, it } from "vitest";
import {
  evaluateInvitationAcceptance,
  isInvitationExpired,
} from "@/modules/invitations/invitation-state-machine";
import type { InvitationRecord } from "@/modules/invitations/invitation-repository";
import { clientA } from "../../fixtures/f001-fixtures";

const invitation = (expiresAt: string): InvitationRecord => ({
  id: "inv_expiry",
  tenantId: clientA.tenantId,
  invitedEmail: "client-viewer-a@example.test",
  membershipType: "client",
  roleKey: "client_viewer",
  clientIds: [clientA.id],
  status: "pending",
  token: "token_expiry",
  expiresAt,
  createdBy: "tenant_admin_a",
  createdAt: "2026-06-24T08:00:00.000Z",
  deliveryState: "sent",
});

describe("invitation expiry boundary", () => {
  it("uses an authoritative timestamp and denies exactly at expires_at", () => {
    const record = invitation("2026-07-01T08:00:00.000Z");

    expect(
      isInvitationExpired({
        invitation: record,
        now: new Date("2026-07-01T07:59:59.999Z"),
      }),
    ).toBe(false);
    expect(
      isInvitationExpired({
        invitation: record,
        now: new Date("2026-07-01T08:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("returns a deterministic expired decision without activating scope", () => {
    expect(
      evaluateInvitationAcceptance({
        invitation: invitation("2026-07-01T08:00:00.000Z"),
        acceptingEmail: "client-viewer-a@example.test",
        acceptingUserId: "client_viewer_a",
        now: new Date("2026-07-01T08:00:00.000Z"),
      }),
    ).toEqual({ ok: false, error: "INVITATION_EXPIRED" });
  });
});
