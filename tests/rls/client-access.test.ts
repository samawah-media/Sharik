import { describe, expect, it } from "vitest";
import {
  canInsertTenantScopedRow,
  canSelectTenantScopedRow,
} from "@/modules/rls/tenant-isolation-policy";
import {
  assignedInternalA,
  clientA,
  clientB,
  clientC,
  tenantAdminA,
  tenantViewerA,
} from "../fixtures/f001-fixtures";

describe("client access RLS simulator", () => {
  it("allows tenant management roles to read and insert tenant clients", () => {
    const actor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "client_basics_select_authorized_scope",
      }),
    ).toBe(true);
    expect(
      canInsertTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId },
        policy: "client_insert_tenant_management",
      }),
    ).toBe(true);
  });

  it("allows assigned internal users only for their assigned client", () => {
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

  it("denies unassigned and cross-tenant client access", () => {
    expect(
      canSelectTenantScopedRow({
        actor: tenantViewerA as never,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "client_basics_select_authorized_scope",
      }),
    ).toBe(false);

    expect(
      canSelectTenantScopedRow({
        actor: {
          ...tenantAdminA.rlsActor,
          roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
        },
        row: { tenantId: clientB.tenantId, clientId: clientB.id },
        policy: "client_basics_select_authorized_scope",
      }),
    ).toBe(false);
  });
});
