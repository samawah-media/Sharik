import { describe, expect, it } from "vitest";
import { canSelectTenantScopedRow } from "@/modules/rls/tenant-isolation-policy";
import {
  assignedInternalA,
  clientA,
  clientB,
  clientC,
  clientViewerA,
  tenantAdminA,
} from "../fixtures/f001-fixtures";

describe("F-004 internal Kanban board RLS simulator", () => {
  it("allows tenant management to read board rows inside its tenant only", () => {
    const actor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "deliverable_board_select_management_or_assigned",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientB.tenantId, clientId: clientB.id },
        policy: "deliverable_board_select_management_or_assigned",
      }),
    ).toBe(false);
  });

  it("allows assigned account managers to read only their assigned client board", () => {
    const actor = {
      userId: assignedInternalA.session.userId,
      tenantMemberships: assignedInternalA.tenantMemberships,
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "deliverable_board_select_management_or_assigned",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientC.tenantId, clientId: clientC.id },
        policy: "deliverable_board_select_management_or_assigned",
      }),
    ).toBe(false);
  });

  it("denies client users access to internal Kanban board rows", () => {
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
        policy: "deliverable_board_select_management_or_assigned",
      }),
    ).toBe(false);
  });
});
