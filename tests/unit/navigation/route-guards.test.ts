import { afterEach, describe, expect, it, vi } from "vitest";
import {
  guardManagementRoute,
  resolveRouteActor,
} from "@/server/navigation/route-guards";

describe("route guard actor fixtures", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ignores query-selected actors in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const actor = resolveRouteActor("tenant_admin_a");
    const access = guardManagementRoute({ actor, route: "clients" });

    expect(actor.userId).toBe("route_actor_unresolved");
    expect(actor.tenantMembership.status).toBe("disabled");
    expect(actor.roleAssignments).toEqual([]);
    expect(access).toMatchObject({
      allowed: false,
      reason: "membership_disabled",
    });
  });

  it("keeps explicit non-production fixtures available for E2E denial coverage", () => {
    vi.stubEnv("NODE_ENV", "development");

    const actor = resolveRouteActor("client_viewer_a");
    const access = guardManagementRoute({ actor, route: "members" });

    expect(actor.userId).toBe("client_viewer_a");
    expect(access).toMatchObject({
      allowed: false,
      reason: "permission_denied",
    });
  });

  it("does not promote unknown non-production fixture keys to tenant admin", () => {
    vi.stubEnv("NODE_ENV", "development");

    const actor = resolveRouteActor("unknown_actor");
    const access = guardManagementRoute({ actor, route: "clients" });

    expect(actor.userId).toBe("route_actor_unresolved");
    expect(access.allowed).toBe(false);
  });
});
