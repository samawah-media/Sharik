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

describe("F-002 commercial raw access RLS simulator", () => {
  it("allows tenant management to read raw commercial rows inside its tenant only", () => {
    const actor = {
      ...tenantAdminA.rlsActor,
      roleAssignments: tenantAdminA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientB.tenantId, clientId: clientB.id },
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(false);
  });

  it("allows assigned account managers to read only assigned client commercial rows and ledger rows", () => {
    const actor = {
      userId: assignedInternalA.session.userId,
      tenantMemberships: assignedInternalA.tenantMemberships,
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    };

    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_ledger_select_management_or_account_manager",
      }),
    ).toBe(true);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientC.tenantId, clientId: clientC.id },
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(false);
  });

  it("denies client members raw commercial and ledger rows before safe summary surfaces exist", () => {
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
        policy: "commercial_raw_select_management_or_assigned",
      }),
    ).toBe(false);
    expect(
      canSelectTenantScopedRow({
        actor,
        row: { tenantId: clientA.tenantId, clientId: clientA.id },
        policy: "commercial_ledger_select_management_or_account_manager",
      }),
    ).toBe(false);
  });
});

