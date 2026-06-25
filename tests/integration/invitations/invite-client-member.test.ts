import { describe, expect, it } from "vitest";
import {
  FailingAuditSink,
  InMemoryAuditSink,
  NonTransactionalAuditSink,
} from "@/modules/audit/audit-service";
import { InMemoryClientRepository } from "@/modules/clients/client-repository";
import { LocalInvitationEmailDispatcher } from "@/modules/invitations/email-dispatcher";
import { InMemoryInvitationRepository } from "@/modules/invitations/invitation-repository";
import { InMemoryMembershipRepository } from "@/modules/memberships/membership-repository";
import { acceptClientInvitationCommand } from "@/server/commands/invitations/accept-invitation";
import { inviteClientMemberCommand } from "@/server/commands/invitations/invite-client-member";
import { clientA, tenantAdminA } from "../../fixtures/f001-fixtures";

const seededClients = () =>
  new InMemoryClientRepository([
    {
      id: clientA.id,
      tenantId: clientA.tenantId,
      name: clientA.name,
      slug: "client-a",
      status: "active",
      createdBy: tenantAdminA.session.userId,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      revision: 1,
    },
  ]);

class FailingCreateInvitationRepository extends InMemoryInvitationRepository {
  override async create(): Promise<never> {
    throw new Error("INVITATION_CREATE_FAILED");
  }
}

class FailingActivateClientMembershipRepository extends InMemoryMembershipRepository {
  override async activateClientMembership(): Promise<never> {
    throw new Error("CLIENT_MEMBERSHIP_ACTIVATION_FAILED");
  }
}

describe("invite client member command", () => {
  it("creates a pending one-client client invitation and audit intent", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository();
    const dispatcher = new LocalInvitationEmailDispatcher();

    const result = await inviteClientMemberCommand({
      actor: tenantAdminA.authorizationActor,
      clients: seededClients(),
      invitations,
      audit,
      dispatcher,
      input: {
        email: "client-viewer-a@example.test",
        roleKey: "client_viewer",
        clientId: clientA.id,
        idempotencyKey: "invite-client-a",
      },
      idFactory: () => "inv_client_a",
      tokenFactory: () => "token_client_a",
      now: () => new Date("2026-06-24T08:00:00.000Z"),
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ok: true,
        value: {
          id: "inv_client_a",
          tenantId: clientA.tenantId,
          membershipType: "client",
          clientIds: [clientA.id],
          status: "pending",
          deliveryState: "sent",
        },
      },
    });
    expect(dispatcher.sent).toHaveLength(1);
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "ClientMemberInvited",
          clientId: clientA.id,
          targetId: "inv_client_a",
        }),
        expect.objectContaining({
          action: "RoleAssigned",
          reason: "intent_pending_acceptance",
        }),
      ]),
    );
  });

  it("denies client self-service actors without creating invitations", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository();
    const clientAdminActor = {
      userId: "client_admin_a",
      tenantId: clientA.tenantId,
      tenantMembership: {
        id: "tm_client_admin_a",
        tenantId: clientA.tenantId,
        userId: "client_admin_a",
        status: "active" as const,
      },
      roleAssignments: [
        {
          id: "ra_client_admin_a",
          tenantId: clientA.tenantId,
          membershipId: "cm_client_admin_a",
          roleKey: "client_admin" as const,
          scopeType: "client" as const,
          scopeId: clientA.id,
          status: "active" as const,
        },
      ],
    };

    const result = await inviteClientMemberCommand({
      actor: clientAdminActor,
      clients: seededClients(),
      invitations,
      audit,
      dispatcher: new LocalInvitationEmailDispatcher(),
      input: {
        email: "client-viewer-a@example.test",
        roleKey: "client_admin",
        clientId: clientA.id,
      },
      idFactory: () => "denied_client_invitation",
    });

    expect(result).toMatchObject({ ok: false });
    expect(await invitations.listByTenant(clientA.tenantId)).toEqual([]);
    expect(audit.events).toContainEqual(
      expect.objectContaining({
        action: "AuthorizationDenied",
        decision: "denied",
      }),
    );
  });

  it("fails closed without creating a client invitation when allowed audit append fails", async () => {
    const invitations = new InMemoryInvitationRepository();
    const dispatcher = new LocalInvitationEmailDispatcher();

    await expect(
      inviteClientMemberCommand({
        actor: tenantAdminA.authorizationActor,
        clients: seededClients(),
        invitations,
        audit: new FailingAuditSink(),
        dispatcher,
        input: {
          email: "client-viewer-a@example.test",
          roleKey: "client_viewer",
          clientId: clientA.id,
          idempotencyKey: "invite-client-fail",
        },
        idFactory: () => "inv_client_fail",
        tokenFactory: () => "token_client_fail",
        now: () => new Date("2026-06-24T08:00:00.000Z"),
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");

    expect(await invitations.listByTenant(clientA.tenantId)).toEqual([]);
    expect(dispatcher.sent).toEqual([]);
  });

  it("rolls back audit when client invitation creation fails", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new FailingCreateInvitationRepository();
    const dispatcher = new LocalInvitationEmailDispatcher();

    await expect(
      inviteClientMemberCommand({
        actor: tenantAdminA.authorizationActor,
        clients: seededClients(),
        invitations,
        audit,
        dispatcher,
        input: {
          email: "client-viewer-a@example.test",
          roleKey: "client_viewer",
          clientId: clientA.id,
          idempotencyKey: "invite-client-mutation-fail",
        },
        idFactory: () => "inv_client_mutation_fail",
        tokenFactory: () => "token_client_mutation_fail",
        now: () => new Date("2026-06-24T08:00:00.000Z"),
      }),
    ).rejects.toThrow("INVITATION_CREATE_FAILED");

    expect(audit.events).toEqual([]);
    expect(dispatcher.sent).toEqual([]);
    expect(await invitations.listByTenant(clientA.tenantId)).toEqual([]);
  });
});

describe("accept client invitation command", () => {
  it("activates client membership and scoped client role for an existing user", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository();
    const memberships = new InMemoryMembershipRepository();

    await inviteClientMemberCommand({
      actor: tenantAdminA.authorizationActor,
      clients: seededClients(),
      invitations,
      audit,
      dispatcher: new LocalInvitationEmailDispatcher(),
      input: {
        email: "client-viewer-a@example.test",
        roleKey: "client_viewer",
        clientId: clientA.id,
      },
      idFactory: () => "inv_client_accept",
      tokenFactory: () => "token_client_accept",
      now: () => new Date("2026-06-24T08:00:00.000Z"),
    });

    const result = await acceptClientInvitationCommand({
      session: {
        userId: "client_viewer_a",
        email: "client-viewer-a@example.test",
      },
      invitationId: "inv_client_accept",
      invitations,
      memberships,
      audit,
      membershipIdFactory: () => "cm_client_viewer_a",
      roleAssignmentIdFactory: () => "ra_client_viewer_a",
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        clientMembership: {
          id: "cm_client_viewer_a",
          tenantId: clientA.tenantId,
          clientId: clientA.id,
          userId: "client_viewer_a",
        },
        roleAssignments: [
          {
            roleKey: "client_viewer",
            scopeType: "client",
            scopeId: clientA.id,
          },
        ],
      },
    });
    expect(await memberships.listTenantMemberships(clientA.tenantId)).toEqual([]);
    expect(audit.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "ClientMembershipActivated" }),
        expect.objectContaining({ action: "InvitationAccepted" }),
      ]),
    );
  });

  it("uses the same path for a newly created auth user session", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository();
    const memberships = new InMemoryMembershipRepository();

    await inviteClientMemberCommand({
      actor: tenantAdminA.authorizationActor,
      clients: seededClients(),
      invitations,
      audit,
      dispatcher: new LocalInvitationEmailDispatcher(),
      input: {
        email: "new-client-user@example.test",
        roleKey: "client_approver",
        clientId: clientA.id,
      },
      idFactory: () => "inv_new_client_accept",
      tokenFactory: () => "token_new_client_accept",
      now: () => new Date("2026-06-24T08:00:00.000Z"),
    });

    const result = await acceptClientInvitationCommand({
      session: {
        userId: "new_client_user",
        email: "new-client-user@example.test",
      },
      invitationId: "inv_new_client_accept",
      invitations,
      memberships,
      audit,
      membershipIdFactory: () => "cm_new_client_user",
      roleAssignmentIdFactory: () => "ra_new_client_user",
      now: () => new Date("2026-06-24T09:00:00.000Z"),
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        roleAssignments: [
          {
            roleKey: "client_approver",
            scopeId: clientA.id,
          },
        ],
      },
    });
  });

  it("fails closed without activating client membership, role, or invitation status when audit append fails", async () => {
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_client_audit_fail",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_client_audit_fail",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);
    const memberships = new InMemoryMembershipRepository();

    await expect(
      acceptClientInvitationCommand({
        session: {
          userId: "client_viewer_a",
          email: "client-viewer-a@example.test",
        },
        invitationId: "inv_client_audit_fail",
        invitations,
        memberships,
        audit: new FailingAuditSink(),
        membershipIdFactory: () => "cm_client_audit_fail",
        roleAssignmentIdFactory: () => "ra_client_audit_fail",
        now: () => new Date("2026-06-24T09:00:00.000Z"),
      }),
    ).rejects.toThrow("AUDIT_APPEND_FAILED");

    expect(await memberships.listClientMemberships(clientA.tenantId)).toEqual([]);
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual([]);
    expect((await invitations.findById("inv_client_audit_fail"))?.status).toBe(
      "pending",
    );
  });

  it("fails closed before activation when audit sink is not transactional", async () => {
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_client_non_transactional",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_client_non_transactional",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);
    const memberships = new InMemoryMembershipRepository();

    await expect(
      acceptClientInvitationCommand({
        session: {
          userId: "client_viewer_a",
          email: "client-viewer-a@example.test",
        },
        invitationId: "inv_client_non_transactional",
        invitations,
        memberships,
        audit: new NonTransactionalAuditSink(),
        membershipIdFactory: () => "cm_client_non_transactional",
        roleAssignmentIdFactory: () => "ra_client_non_transactional",
        now: () => new Date("2026-06-24T09:00:00.000Z"),
      }),
    ).rejects.toThrow("AUDIT_TRANSACTION_REQUIRED");

    expect(await memberships.listClientMemberships(clientA.tenantId)).toEqual([]);
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual([]);
    expect(
      (await invitations.findById("inv_client_non_transactional"))?.status,
    ).toBe("pending");
  });

  it("rolls back audit and invitation status when client membership activation fails", async () => {
    const audit = new InMemoryAuditSink();
    const invitations = new InMemoryInvitationRepository([
      {
        id: "inv_client_mutation_fail",
        tenantId: clientA.tenantId,
        invitedEmail: "client-viewer-a@example.test",
        membershipType: "client",
        roleKey: "client_viewer",
        clientIds: [clientA.id],
        status: "pending",
        token: "token_client_mutation_fail",
        expiresAt: "2026-07-01T08:00:00.000Z",
        createdBy: tenantAdminA.session.userId,
        createdAt: "2026-06-24T08:00:00.000Z",
        deliveryState: "sent",
      },
    ]);
    const memberships = new FailingActivateClientMembershipRepository();

    await expect(
      acceptClientInvitationCommand({
        session: {
          userId: "client_viewer_a",
          email: "client-viewer-a@example.test",
        },
        invitationId: "inv_client_mutation_fail",
        invitations,
        memberships,
        audit,
        membershipIdFactory: () => "cm_client_mutation_fail",
        roleAssignmentIdFactory: () => "ra_client_mutation_fail",
        now: () => new Date("2026-06-24T09:00:00.000Z"),
      }),
    ).rejects.toThrow("CLIENT_MEMBERSHIP_ACTIVATION_FAILED");

    expect(audit.events).toEqual([]);
    expect(await memberships.listClientMemberships(clientA.tenantId)).toEqual([]);
    expect(await memberships.listRoleAssignments(clientA.tenantId)).toEqual([]);
    expect((await invitations.findById("inv_client_mutation_fail"))?.status).toBe(
      "pending",
    );
  });
});
