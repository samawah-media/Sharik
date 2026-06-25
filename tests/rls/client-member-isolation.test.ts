import { describe, expect, it } from "vitest";
import {
  canInsertTenantScopedRow,
  canSelectTenantScopedRow,
} from "@/modules/rls/tenant-isolation-policy";
import {
  clientA,
  clientC,
  clientViewerA,
  tenantAdminA,
} from "../fixtures/f001-fixtures";

describe("client member isolation RLS simulator", () => {
  it("allows client users to read only their own client basics", () => {
    const actor = {
      userId: clientViewerA.session.userId,
      tenantMemberships: [clientViewerA.authorizationActor.tenantMembership],
      clientMemberships: clientViewerA.clientMemberships,
      roleAssignments: clientViewerA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "client_basics_select_authorized_scope",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientC.tenantId, clientId: clientC.id },
        policy: "client_basics_select_authorized_scope",
      }),
    ).toBe(false);
  });

  it("denies tenant-wide invitation and audit access to client roles", () => {
    const actor = {
      userId: clientViewerA.session.userId,
      tenantMemberships: [clientViewerA.authorizationActor.tenantMembership],
      clientMemberships: clientViewerA.clientMemberships,
      roleAssignments: clientViewerA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_select_tenant_management",
      }),
    ).toBe(false);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "audit_select_tenant_management",
      }),
    ).toBe(false);
    expect(
      canInsertTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_insert_tenant_management",
      }),
    ).toBe(false);
  });

  it("keeps tenant management audit and invitation access unchanged", () => {
    const actor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "audit_select_tenant_management",
      }),
    ).toBe(true);
  });
});
