import { afterEach, describe, expect, it, vi } from "vitest";
import {
  guardClientsIndexRoute,
  guardManagementRoute,
  routeClients,
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
    vi.stubEnv("APP_ENV", "test");

    const actor = resolveRouteActor("client_viewer_a");
    const access = guardManagementRoute({ actor, route: "members" });

    expect(actor.userId).toBe("client_viewer_a");
    expect(access).toMatchObject({
      allowed: false,
      reason: "permission_denied",
    });
  });

  it("allows assigned internal users to open the clients index for scoped clients", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_ENV", "test");

    const actor = resolveRouteActor("assigned_internal_a");
    const access = guardClientsIndexRoute({ actor, clients: routeClients });

    expect(actor.userId).toBe("assigned_internal_a");
    expect(access).toMatchObject({ allowed: true });
  });

  it("keeps client portal users out of the management clients index", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_ENV", "test");

    const actor = resolveRouteActor("client_viewer_a");
    const access = guardClientsIndexRoute({ actor, clients: routeClients });

    expect(access).toMatchObject({
      allowed: false,
      reason: "permission_denied",
      safeReturnHref: "/client",
    });
  });

  it("does not promote unknown non-production fixture keys to tenant admin", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_ENV", "test");

    const actor = resolveRouteActor("unknown_actor");
    const access = guardManagementRoute({ actor, route: "clients" });

    expect(actor.userId).toBe("route_actor_unresolved");
    expect(access.allowed).toBe(false);
  });
});
