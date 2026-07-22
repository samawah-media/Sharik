import { describe, expect, it } from "vitest";
import { resolveRoleAwareNavigation } from "@/modules/navigation/navigation-resolver";
import {
  assignedInternalA,
  clientA,
  clientC,
  clientViewerA,
  tenantAdminA,
  tenantViewerA,
} from "../../fixtures/f001-fixtures";

describe("role-aware navigation resolver", () => {
  it("shows tenant administration navigation only to tenant management roles", () => {
    const navigation = resolveRoleAwareNavigation({
      actor: tenantAdminA.authorizationActor,
      assignedClients: [clientA, clientC],
    });

    expect(navigation.state).toBe("ready");
    expect(navigation.items.map((item) => item.id)).toEqual([
      "management.dashboard",
      "management.clients",
      "management.members",
    ]);
    expect(navigation.items.every((item) => item.advisoryOnly)).toBe(true);
  });

  it("limits assigned internal users to portfolio and assigned clients", () => {
    const navigation = resolveRoleAwareNavigation({
      actor: assignedInternalA.authorizationActor,
      assignedClients: [clientA, clientC],
    });

    expect(navigation.state).toBe("ready");
    expect(navigation.items.map((item) => item.id)).toEqual([
      "team.work",
      "team.portfolio",
    ]);
    expect(navigation.items.map((item) => item.label)).not.toContain(
      clientC.name,
    );
    expect(navigation.items.map((item) => item.href)).not.toContain(
      "/clients",
    );
  });

  it("keeps client users inside the client portal and hides tenant-wide navigation", () => {
    const viewerNavigation = resolveRoleAwareNavigation({
      actor: clientViewerA.authorizationActor,
      assignedClients: [clientA],
    });
    const approverNavigation = resolveRoleAwareNavigation({
      actor: {
        ...clientViewerA.authorizationActor,
        roleAssignments: clientViewerA.authorizationActor.roleAssignments.map(
          (assignment) => ({
            ...assignment,
            roleKey: "client_approver" as const,
          }),
        ),
      },
      assignedClients: [clientA],
    });

    expect(viewerNavigation.items.map((item) => item.id)).toEqual([
      "client.home",
      "client.deliverables",
      "client.package",
    ]);
    expect(approverNavigation.items.map((item) => item.id)).toEqual([
      "client.home",
      "client.deliverables",
      "client.package",
      "client.pendingApprovals",
    ]);
    expect(
      [...viewerNavigation.items, ...approverNavigation.items].some((item) =>
        item.href.startsWith("/members"),
      ),
    ).toBe(false);
  });

  it("denies by default when the user has no client scope", () => {
    const navigation = resolveRoleAwareNavigation({
      actor: tenantViewerA.authorizationActor,
      assignedClients: [clientA],
    });

    expect(navigation.state).toBe("no_assigned_clients");
    expect(navigation.items).toEqual([]);
    expect(navigation.denial?.copyKey).toBe("f001.access.noAssignedClients");
  });
});
