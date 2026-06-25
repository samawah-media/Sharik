import { describe, expect, it } from "vitest";
import { FailingAuditSink, InMemoryAuditSink } from "@/modules/audit/audit-service";
import {
  InMemoryMembershipRepository,
  type MembershipRepository,
} from "@/modules/memberships/membership-repository";
import { evaluatePermission } from "@/modules/authorization/evaluator";
import { PERMISSIONS } from "@/modules/authorization/permission-catalog";
import { removeClientScopeCommand } from "@/server/commands/memberships/remove-client-scope";
import {
  assignedInternalA,
  clientA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

class FailingRemoveClientScopeRepository extends InMemoryMembershipRepository {
  override async removeClientScope(): Promise<never> {
    throw new Error("CLIENT_SCOPE_REMOVE_FAILED");
  }
}

const withoutTransaction = (
  memberships: InMemoryMembershipRepository,
): MembershipRepository =>
  ({
    findTenantMembership: memberships.findTenantMembership.bind(memberships),
    findTenantMembershipById:
      memberships.findTenantMembershipById.bind(memberships),
    findClientMembershipById:
      memberships.findClientMembershipById.bind(memberships),
    findMembershipById: memberships.findMembershipById.bind(memberships),
    findRoleAssignmentById:
      memberships.findRoleAssignmentById.bind(memberships),
    activateTenantMembership:
      memberships.activateTenantMembership.bind(memberships),
    activateClientMembership:
      memberships.activateClientMembership.bind(memberships),
    assignRole: memberships.assignRole.bind(memberships),
    updateRoleAssignment: memberships.updateRoleAssignment.bind(memberships),
    removeClientScope: memberships.removeClientScope.bind(memberships),
    disableMembership: memberships.disableMembership.bind(memberships),
    revokeRoleAssignmentsForMembership:
      memberships.revokeRoleAssignmentsForMembership.bind(memberships),
    listTenantMemberships: memberships.listTenantMemberships.bind(memberships),
    listClientMemberships: memberships.listClientMemberships.bind(memberships),
    listRoleAssignments: memberships.listRoleAssignments.bind(memberships),
  }) satisfies MembershipRepository;

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

  it("fails closed without removing client scope when audit append fails", async () => {
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });

    await expect(
      removeClientScopeCommand({
        actor: tenantAdminA.authorizationActor,
        memberships,
        audit: new FailingAuditSink(),
        input: {
          membershipId: assignedInternalA.tenantMemberships[0].id,
          clientId: clientA.id,
          reason: "client assignment ended",
        },
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");

    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual(
      assignedInternalA.authorizationActor.roleAssignments,
    );
  });

  it("rolls back audit when client scope mutation fails", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new FailingRemoveClientScopeRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });

    await expect(
      removeClientScopeCommand({
        actor: tenantAdminA.authorizationActor,
        memberships,
        audit,
        input: {
          membershipId: assignedInternalA.tenantMemberships[0].id,
          clientId: clientA.id,
          reason: "client assignment ended",
        },
      }),
    ).rejects.toThrow("CLIENT_SCOPE_REMOVE_FAILED");

    expect(audit.events).toEqual([]);
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual(
      assignedInternalA.authorizationActor.roleAssignments,
    );
  });

  it("fails closed before mutation when membership repository is not transactional", async () => {
    const audit = new InMemoryAuditSink();
    const transactionalMemberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });

    await expect(
      removeClientScopeCommand({
        actor: tenantAdminA.authorizationActor,
        memberships: withoutTransaction(transactionalMemberships),
        audit,
        input: {
          membershipId: assignedInternalA.tenantMemberships[0].id,
          clientId: clientA.id,
          reason: "client assignment ended",
        },
      }),
    ).rejects.toThrow("AUDIT_TRANSACTION_REQUIRED");

    expect(audit.events).toEqual([]);
    expect(
      await transactionalMemberships.listRoleAssignments(clientA.tenantId),
    ).toEqual(assignedInternalA.authorizationActor.roleAssignments);
  });
});
