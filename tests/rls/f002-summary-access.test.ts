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

describe("F-002D scope-safe summary RLS simulator checks", () => {
  it("allows management and assigned internal users to read safe summaries only inside authorized client scope", () => {
    const tenantActor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };
    const assignedActor = {
      userId: assignedInternalA.session.userId,
      tenantMemberships: assignedInternalA.tenantMemberships,
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor: tenantActor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_safe_summary_select_authorized_scope",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor: assignedActor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_safe_summary_select_authorized_scope",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor: assignedActor,
        row: { tenantId: clientC.tenantId, clientId: clientC.id },
        policy: "commercial_safe_summary_select_authorized_scope",
      }),
    ).toBe(false);
  });

  it("allows client users to read safe summaries for their own client while raw commercial rows remain denied", () => {
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
        policy: "commercial_safe_summary_select_authorized_scope",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(false);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientB.tenantId, clientId: clientB.id },
        policy: "commercial_safe_summary_select_authorized_scope",
      }),
    ).toBe(false);
  });
});
