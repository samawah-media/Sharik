import { describe, expect, it } from "vitest";
import {
  getClientWorkspaces,
  selectClientWorkspace,
} from "@/server/auth/client-workspace";
import type { RuntimeContext } from "@/server/auth/runtime-context";

function context(): Extract<RuntimeContext, { ok: true }> {
  return {
    ok: true,
    actor: {
      userId: "user",
      tenantId: "tenant",
      tenantMembership: {
        id: "member",
        userId: "user",
        tenantId: "tenant",
        status: "active",
      },
      roleAssignments: ["a", "b"].map((id) => ({
        id,
        tenantId: "tenant",
        membershipId: "member",
        roleKey: id === "a" ? "client_approver" : "client_viewer",
        scopeType: "client",
        scopeId: id,
        status: "active",
      })),
    },
    clients: ["a", "b", "c"].map((id) => ({
      id,
      name: id.toUpperCase(),
      tenantId: "tenant",
      slug: id,
      status: "active",
      createdBy: "admin",
      createdAt: "2026-09-10",
      updatedAt: "2026-09-10",
      revision: 1,
    })),
    clientMemberships: ["a", "b"].map((id) => ({
      id,
      clientId: id,
      tenantId: "tenant",
      userId: "user",
      status: "active",
    })),
  };
}

describe("client workspace authorization", () => {
  it("selects an authorized second workspace instead of always choosing the first", () => {
    expect(selectClientWorkspace(context(), "b")?.id).toBe("b");
    expect(getClientWorkspaces(context()).map((c) => c.id)).toEqual(["a", "b"]);
  });
  it("falls back only to an authorized workspace for stale preferences", () => {
    expect(selectClientWorkspace(context(), "c")?.id).toBe("a");
    expect(selectClientWorkspace(context(), "malformed")?.id).toBe("a");
  });
  it.each(["disabled", "removed"] as const)(
    "excludes %s client membership even with a surviving role",
    (status) => {
      const runtime = context();
      runtime.clientMemberships[1].status = status;
      expect(getClientWorkspaces(runtime).map((c) => c.id)).toEqual(["a"]);
    },
  );
  it("excludes revoked roles and archived clients", () => {
    const runtime = context();
    runtime.actor.roleAssignments[0].status = "disabled";
    runtime.clients[1].status = "archived";
    expect(getClientWorkspaces(runtime)).toEqual([]);
    expect(selectClientWorkspace(runtime, "a")).toBeUndefined();
  });
  it("rejects cross-tenant clients and memberships belonging to another user", () => {
    const runtime = context();
    runtime.clients[0].tenantId = "other";
    runtime.clientMemberships[1].userId = "other";
    expect(getClientWorkspaces(runtime)).toEqual([]);
  });
  it("rejects mismatched membership role ids and tenant-level admin grants", () => {
    const runtime = context();
    runtime.actor.roleAssignments[0].membershipId = "other";
    runtime.actor.roleAssignments[1].roleKey = "tenant_administrator";
    expect(getClientWorkspaces(runtime)).toEqual([]);
  });
  it("fails closed for unavailable runtime and disabled tenant membership", () => {
    expect(
      getClientWorkspaces({ ok: false, reason: "runtime_unavailable" }),
    ).toEqual([]);
    const runtime = context();
    runtime.actor.tenantMembership.status = "disabled";
    expect(getClientWorkspaces(runtime)).toEqual([]);
  });
});
