import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { removeClientScopeCommand } from "@/server/commands/memberships/remove-client-scope";
import {
  assignedInternalA,
  clientA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

describe("remove client scope command", () => {
  it("revokes future Client A access and preserves audit", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });

    const result = await removeClientScopeCommand({
      actor: tenantAdminA.authorizationActor,
      memberships,
      audit,
      input: {
        membershipId: assignedInternalA.tenantMemberships[0].id,
        clientId: clientA.id,
        reason: "client assignment ended",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          revokedRoleAssignments: [
            expect.objectContaining({ status: "removed" }),
          ],
        },
      },
    });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "ClientScopeRemoved",
          clientId: clientA.id,
        }),
      ]),
    );

    const remainingRoles = await memberships.listRoleAssignments(clientA.tenantId);
    const decision = evaluatePermission({
      actor: {
        ...assignedInternalA.authorizationActor,
        roleAssignments: remainingRoles,
      },
      permission: PERMISSIONS.CLIENT_VIEW,
      resource: { tenantId: clientA.tenantId, clientId: clientA.id },
    });

    expect(decision).toEqual({
      allowed: false,
      reason: "permission_not_granted",
    });
  });
});
