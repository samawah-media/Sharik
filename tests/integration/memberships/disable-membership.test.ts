import { describe, expect, it } from "vitest";
import { FailingAuditSink, InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { assignRoleCommand } from "@/server/commands/roles/assign-role";
import { disableMembershipCommand } from "@/server/commands/memberships/disable-membership";
import {
  assignedInternalA,
  clientA,
  disabledTenantMember,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

class FailingDisableMembershipRepository extends InMemoryMembershipRepository {
  override async disableMembership(): Promise<never> {
    throw new Error("MEMBERSHIP_DISABLE_FAILED");
  }
}

describe("disable membership command", () => {
  it("suspends membership, revokes roles, cancels pending invitations, and audits", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_pending_offboard",
        tenantId: clientA.tenantId,
        invitedEmail: "assigned_internal_a@example.test",
        membershipType: "internal",
        roleKey: "designer",
        clientIds: [clientA.id],
        status: "pending",
        token: "pending-token",
        expiresAt: "2026-07-01T00:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T00:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    const result = await disableMembershipCommand({
      actor: tenantAdminA.authorizationActor,
      memberships,
      invitations,
      audit,
      input: {
        membershipKind: "tenant",
        membershipId: assignedInternalA.tenantMemberships[0].id,
        invitedEmail: "assigned_internal_a@example.test",
        reason: "offboarding",
      },
      now: () => new Date("2026-06-24T12:00:00.000Z"),
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          disabled: { status: "disabled" },
          revokedAssignments: [expect.objectContaining({ status: "removed" })],
          revokedInvitations: [
            expect.objectContaining({
              id: "inv_pending_offboard",
              status: "revoked",
            }),
          ],
        },
      },
    });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "MembershipSuspended" }),
        expect.objectContaining({ action: "InvitationRevoked" }),
      ]),
    );
  });

  it("blocks disablement when active responsibilities are unresolved", async () => {
    const audit = new InMemoryAuditSink();
    const result = await disableMembershipCommand({
      actor: tenantAdminA.authorizationActor,
      memberships: new InMemoryMembershipRepository({
        tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      }),
      invitations: new InMemoryInvitationRepository(),
      audit,
      input: {
        membershipKind: "tenant",
        membershipId: assignedInternalA.tenantMemberships[0].id,
        reason: "offboarding",
        hasActiveResponsibilities: true,
        responsibilityTransferStatus: "blocked",
      },
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION_FAILED" });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "MembershipSuspensionBlocked",
          decision: "denied",
        }),
      ]),
    );
  });

  it("fails closed without disabling membership, revoking roles, or cancelling invitations when audit append fails", async () => {
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_pending_audit_fail",
        tenantId: clientA.tenantId,
        invitedEmail: "assigned_internal_a@example.test",
        membershipType: "internal",
        roleKey: "designer",
        clientIds: [clientA.id],
        status: "pending",
        token: "pending-token-audit-fail",
        expiresAt: "2026-07-01T00:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T00:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    await expect(
      disableMembershipCommand({
        actor: tenantAdminA.authorizationActor,
        memberships,
        invitations,
        audit: new FailingAuditSink(),
        input: {
          membershipKind: "tenant",
          membershipId: assignedInternalA.tenantMemberships[0].id,
          invitedEmail: "assigned_internal_a@example.test",
          reason: "offboarding",
        },
        now: () => new Date("2026-06-24T12:00:00.000Z"),
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");

    expect(
      await memberships.findTenantMembershipById(
        assignedInternalA.tenantMemberships[0].id,
      ),
    ).toMatchObject({ status: "active" });
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual(
      assignedInternalA.authorizationActor.roleAssignments,
    );
    expect((await invitations.findById("inv_pending_audit_fail"))?.status).toBe(
      "pending",
    );
  });

  it("rolls back audit when membership disable mutation fails", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new FailingDisableMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      roleAssignments: assignedInternalA.authorizationActor.roleAssignments,
    });
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_pending_disable_mutation_fail",
        tenantId: clientA.tenantId,
        invitedEmail: "assigned_internal_a@example.test",
        membershipType: "internal",
        roleKey: "designer",
        clientIds: [clientA.id],
        status: "pending",
        token: "pending-token-disable-mutation-fail",
        expiresAt: "2026-07-01T00:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T00:00:00.000Z",
        deliveryState: "sent",
      },
    ]);

    await expect(
      disableMembershipCommand({
        actor: tenantAdminA.authorizationActor,
        memberships,
        invitations,
        audit,
        input: {
          membershipKind: "tenant",
          membershipId: assignedInternalA.tenantMemberships[0].id,
          invitedEmail: "assigned_internal_a@example.test",
          reason: "offboarding",
        },
        now: () => new Date("2026-06-24T12:00:00.000Z"),
      }),
    ).rejects.toThrow("MEMBERSHIP_DISABLE_FAILED");

    expect(audit.events).toEqual([]);
    expect(
      await memberships.findTenantMembershipById(
        assignedInternalA.tenantMemberships[0].id,
      ),
    ).toMatchObject({ status: "active" });
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual(
      assignedInternalA.authorizationActor.roleAssignments,
    );
    expect(
      (await invitations.findById("inv_pending_disable_mutation_fail"))?.status,
    ).toBe("pending");
  });

  it("denies protected commands for disabled actor with an active session", async () => {
    const audit = new InMemoryAuditSink();
    const denied = await assignRoleCommand({
      actor: disabledTenantMember.authorizationActor,
      memberships: new InMemoryMembershipRepository({
        tenantMemberships: [assignedInternalA.tenantMemberships[0]],
      }),
      audit,
      input: {
        membershipKind: "tenant",
        membershipId: assignedInternalA.tenantMemberships[0].id,
        roleKey: "designer",
        scopeType: "client",
        scopeId: clientA.id,
        reason: "stale session attempt",
      },
    });

    expect(denied).toEqual({
      ok: false,
      error: "ROLE_ASSIGNMENT_DENIED",
    });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "RoleAssignmentDenied",
          decision: "denied",
          reason: "actor_not_authorized",
        }),
      ]),
    );
  });
});
