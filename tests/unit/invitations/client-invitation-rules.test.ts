import { describe, expect, it } from "vitest";
import {
  validateClientInvitationScope,
} from "@/modules/invitations/client-invitation-rules";
import { clientA, clientC, tenantA, tenantB } from "../../fixtures/f001-fixtures";

const clients = [
  {
    id: clientA.id,
    tenantId: clientA.tenantId,
    name: clientA.name,
    slug: "client-a",
    status: "active" as const,
    createdBy: "tenant_admin_a",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    revision: 1,
  },
  {
    id: clientC.id,
    tenantId: clientC.tenantId,
    name: clientC.name,
    slug: "client-c",
    status: "active" as const,
    createdBy: "tenant_admin_a",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    revision: 1,
  },
];

describe("client invitation rules", () => {
  it("allows approved client roles with exactly one client scope", () => {
    expect(
      validateClientInvitationScope({
        tenantId: tenantA.id,
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        clients,
      }),
    ).toEqual({ ok: true, clientId: clientA.id });
  });

  it("denies non-client roles and multi-client client invitations", () => {
    expect(
      validateClientInvitationScope({
        tenantId: tenantA.id,
        roleKey: "account_manager",
        clientIds: [clientA.id],
        clients,
      }),
    ).toEqual({ ok: false, error: "ROLE_ASSIGNMENT_DENIED" });

    expect(
      validateClientInvitationScope({
        tenantId: tenantA.id,
        roleKey: "client_viewer",
        clientIds: [clientA.id, clientC.id],
        clients,
      }),
    ).toEqual({ ok: false, error: "VALIDATION_FAILED" });
  });

  it("denies client scopes outside the actor tenant", () => {
    expect(
      validateClientInvitationScope({
        tenantId: tenantB.id,
        roleKey: "client_admin",
        clientIds: [clientA.id],
        clients,
      }),
    ).toEqual({ ok: false, error: "CLIENT_ACCESS_DENIED" });
  });
});
