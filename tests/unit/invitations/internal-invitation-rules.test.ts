import { describe, expect, it } from "vitest";
import {
  isInternalInvitationRole,
  validateInternalInvitationScope,
} from "@/modules/invitations/internal-invitation-rules";
import { clientA, clientB, clientC, tenantA } from "../../fixtures/f001-fixtures";

const clientRecord = (client: typeof clientA) => ({
  ...client,
  slug: client.id,
  status: "active" as const,
  createdBy: "tenant_admin_a",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  revision: 1,
});

describe("internal invitation rules", () => {
  it("allows internal execution roles with explicit in-tenant client scope", () => {
    const result = validateInternalInvitationScope({
      tenantId: tenantA.id,
      roleKey: "account_manager",
      clientIds: [clientA.id, clientC.id],
      clients: [clientRecord(clientA), clientRecord(clientC)],
    });

    expect(result).toEqual({
      ok: true,
      clientIds: [clientA.id, clientC.id],
    });
  });

  it("denies empty client scope for internal invitations", () => {
    expect(
      validateInternalInvitationScope({
        tenantId: tenantA.id,
        roleKey: "designer",
        clientIds: [],
        clients: [clientRecord(clientA)],
      }),
    ).toEqual({ ok: false, error: "VALIDATION_FAILED" });
  });

  it("denies cross-tenant client scope", () => {
    expect(
      validateInternalInvitationScope({
        tenantId: tenantA.id,
        roleKey: "content_writer",
        clientIds: [clientB.id],
        clients: [clientRecord(clientB)],
      }),
    ).toEqual({ ok: false, error: "CLIENT_ACCESS_DENIED" });
  });

  it("does not allow tenant or client external roles in A3", () => {
    expect(isInternalInvitationRole("tenant_administrator")).toBe(false);
    expect(isInternalInvitationRole("client_viewer")).toBe(false);
  });
});
