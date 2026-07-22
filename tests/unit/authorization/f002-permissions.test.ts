import { describe, expect, it } from "vitest";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import {
  PERMISSIONS,
  roleGrantsPermission,
} from "@/modules/authorization/permission-catalog";
import {
  clientA,
  clientB,
  tenantA,
  tenantViewerA,
} from "../../fixtures/f001-fixtures";
import { f002Actors } from "../../fixtures/f002-fixtures";

describe("F-002 permissions", () => {
  it("registers every deliverables-core permission id", () => {
    expect(PERMISSIONS.CONTRACT_CREATE).toBe("PERM.CONTRACT.CREATE");
    expect(PERMISSIONS.CONTRACT_VIEW).toBe("PERM.CONTRACT.VIEW");
    expect(PERMISSIONS.PACKAGE_CREATE).toBe("PERM.PACKAGE.CREATE");
    expect(PERMISSIONS.PACKAGE_ADJUST).toBe("PERM.PACKAGE.ADJUST");
    expect(PERMISSIONS.DELIVERABLE_CREATE).toBe("PERM.DELIVERABLE.CREATE");
    expect(PERMISSIONS.DELIVERABLE_EXTRA_CREATE).toBe(
      "PERM.DELIVERABLE.EXTRA_CREATE",
    );
    expect(PERMISSIONS.DELIVERABLE_CANCEL_NOT_STARTED).toBe(
      "PERM.DELIVERABLE.CANCEL_NOT_STARTED",
    );
    expect(PERMISSIONS.DELIVERABLE_STATUS_UPDATE).toBe(
      "PERM.DELIVERABLE.STATUS_UPDATE",
    );
    expect(PERMISSIONS.DELIVERABLE_VERSION_SUBMIT).toBe(
      "PERM.DELIVERABLE.VERSION_SUBMIT",
    );
    expect(PERMISSIONS.LEDGER_VIEW_SUMMARY).toBe(
      "PERM.LEDGER.VIEW_SUMMARY",
    );
  });

  it("grants version submission without approval authority to supported team roles", () => {
    for (const role of ["account_manager", "content_writer", "designer"] as const) {
      expect(roleGrantsPermission(role, PERMISSIONS.DELIVERABLE_VERSION_SUBMIT)).toBe(true);
      expect(roleGrantsPermission(role, PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE)).toBe(false);
      expect(roleGrantsPermission(role, PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT)).toBe(false);
      expect(roleGrantsPermission(role, PERMISSIONS.DELIVERABLE_CLIENT_APPROVE)).toBe(false);
    }
  });

  it("allows tenant administrators to manage contracts, packages, deliverables, and ledger summaries", () => {
    expect(roleGrantsPermission("tenant_administrator", PERMISSIONS.CONTRACT_CREATE)).toBe(
      true,
    );
    expect(roleGrantsPermission("tenant_administrator", PERMISSIONS.PACKAGE_ADJUST)).toBe(
      true,
    );
    expect(
      roleGrantsPermission("tenant_administrator", PERMISSIONS.DELIVERABLE_EXTRA_CREATE),
    ).toBe(true);
    expect(roleGrantsPermission("tenant_administrator", PERMISSIONS.LEDGER_VIEW_SUMMARY)).toBe(
      true,
    );
  });

  it("allows account managers to create and cancel normal client-scoped deliverables only inside assigned client scope", () => {
    expect(
      evaluatePermission({
        actor: f002Actors.accountManagerClientA,
        permission: PERMISSIONS.DELIVERABLE_CREATE,
        resource: { tenantId: tenantA.id, clientId: clientA.id },
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluatePermission({
        actor: f002Actors.accountManagerClientA,
        permission: PERMISSIONS.DELIVERABLE_STATUS_UPDATE,
        resource: { tenantId: tenantA.id, clientId: clientA.id },
      }),
    ).toEqual({ allowed: true });

    expect(
      evaluatePermission({
        actor: f002Actors.accountManagerClientA,
        permission: PERMISSIONS.DELIVERABLE_EXTRA_CREATE,
        resource: { tenantId: tenantA.id, clientId: clientA.id },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });

    expect(
      evaluatePermission({
        actor: f002Actors.accountManagerClientA,
        permission: PERMISSIONS.DELIVERABLE_CREATE,
        resource: { tenantId: clientB.tenantId, clientId: clientB.id },
      }),
    ).toEqual({
      allowed: false,
      reason: "scope_mismatch",
    });
  });

  it("continues to deny users with no matching F-002 role grant by default", () => {
    expect(
      evaluatePermission({
        actor: tenantViewerA.authorizationActor,
        permission: PERMISSIONS.CONTRACT_CREATE,
        resource: { tenantId: tenantA.id, clientId: clientA.id },
      }),
    ).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });
  });
});

