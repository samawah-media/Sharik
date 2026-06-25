import { describe, expect, it } from "vitest";
import { InMemoryAuditSink } from "@/modules/audit/audit-service";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { assignRoleCommand } from "@/server/commands/roles/assign-role";
import { changeRoleAssignmentCommand } from "@/server/commands/roles/change-role-assignment";
import {
  assignedInternalA,
  clientA,
  tenantAdminA,
} from "../../fixtures/f001-fixtures";

describe("role lifecycle commands", () => {
  it("assigns and updates a scoped role with audit events", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
    });

    const assigned = await assignRoleCommand({
      actor: tenantAdminA.authorizationActor,
      memberships,
      audit,
      input: {
        membershipKind: "tenant",
        membershipId: assignedInternalA.tenantMemberships[0].id,
        roleKey: "designer",
        scopeType: "client",
        scopeId: clientA.id,
        reason: "coverage update",
      },
      idFactory: () => "ra_designer_a",
    });

    expect(assigned).toMatchObject({
      ok: true,
      value: { id: "ra_designer_a", roleKey: "designer" },
    });

    const changed = await changeRoleAssignmentCommand({
      actor: tenantAdminA.authorizationActor,
      memberships,
      audit,
      input: {
        assignmentId: "ra_designer_a",
        membershipKind: "tenant",
        roleKey: "content_writer",
        reason: "handoff to content",
      },
    });

    expect(changed).toMatchObject({
      ok: true,
      value: { id: "ra_designer_a", roleKey: "content_writer" },
    });
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "RoleAssigned",
          targetId: "ra_designer_a",
          reason: "coverage update",
        }),
        expect.objectContaining({
          action: "RoleUpdated",
          targetId: "ra_designer_a",
          reason: "handoff to content",
        }),
      ]),
    );
  });

  it("records a safe denial when actor cannot update roles", async () => {
    const audit = new InMemoryAuditSink();
    const memberships = new InMemoryMembershipRepository({
      tenantMemberships: [assignedInternalA.tenantMemberships[0]],
    });

    const denied = await assignRoleCommand({
      actor: assignedInternalA.authorizationActor,
      memberships,
      audit,
      input: {
        membershipKind: "tenant",
        membershipId: assignedInternalA.tenantMemberships[0].id,
        roleKey: "designer",
        scopeType: "client",
        scopeId: clientA.id,
        reason: "unauthorized escalation",
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
        }),
      ]),
    );
  });
});
