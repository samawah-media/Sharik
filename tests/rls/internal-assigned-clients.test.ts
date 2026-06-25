import { describe, expect, it } from "vitest";
import {
  canInsertTenantScopedRow,
  canSelectTenantScopedRow,
} from "@/modules/rls/tenant-isolation-policy";
import {
  assignedInternalA,
  clientA,
  clientC,
  tenantAdminA,
  tenantViewerA,
} from "../fixtures/f001-fixtures";

describe("internal assigned clients and invitation RLS simulator", () => {
  it("keeps assigned internal users limited to assigned clients", () => {
    const actor = {
      userId: assignedInternalA.session.userId,
      tenantMemberships: assignedInternalA.tenantMemberships,
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
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

  it("allows only tenant management to create and read internal invitations", () => {
    const admin = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canInsertTenantScopedRow({
        actor: admin,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_insert_tenant_management",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor: admin,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_select_tenant_management",
      }),
    ).toBe(true);
    expect(
      canInsertTenantScopedRow({
        actor: tenantViewerA as never,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_insert_tenant_management",
      }),
    ).toBe(false);
    expect(
      canSelectTenantScopedRow({
        actor: {
          userId: assignedInternalA.session.userId,
          tenantMemberships: assignedInternalA.tenantMemberships,
          roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
        },
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "invitation_select_tenant_management",
      }),
    ).toBe(false);
  });

  it("limits audit reads to tenant management roles", () => {
    expect(
      canSelectTenantScopedRow({
        actor: {
          userId: assignedInternalA.session.userId,
          tenantMemberships: assignedInternalA.tenantMemberships,
          roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
        },
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "audit_select_tenant_management",
      }),
    ).toBe(false);
  });
});
