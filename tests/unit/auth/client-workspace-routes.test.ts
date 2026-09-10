import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeContext } from "@/server/auth/runtime-context";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import ClientHomePage from "@/app/(client)/client/page";
import ClientWorkPage from "@/app/(client)/client/work/page";
import ClientPendingPage from "@/app/(client)/client/pending/page";
import ClientFilesPage from "@/app/(client)/client/files/page";
import ClientCommercialPage from "@/app/(client)/client/commercial/page";
import ClientDetailPage from "@/app/(client)/client/work/[deliverableId]/page";
import ClientLayout from "@/app/(client)/client/layout";
import * as routeGuards from "@/server/navigation/route-guards";
import { fixtureClientCommercialSummary } from "@/server/actions/commercial-summary-read";

const boundary = vi.hoisted(() => ({
  runtime: {} as RuntimeContext,
  preference: "b",
  fixtures: false,
  readFailure: false,
  scopes: [] as Array<{ tenantId: string; clientId: string }>,
  detailClient: "b",
}));

vi.mock("@/server/auth/runtime-context", () => ({
  resolveRuntimeContext: async () => boundary.runtime,
}));
vi.mock("@/server/navigation/route-fixture-env", () => ({
  canUseRouteActorFixtures: () => boundary.fixtures,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: `user.tenant.${boundary.preference}` }) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/client",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  redirect: (href: string) => { throw new Error(`redirect:${href}`); },
}));
vi.mock("@/server/actions/notifications-read", () => ({
  readNotificationBellData: async () => ({ unreadCount: 0, recent: [] }),
}));

function detail(clientId: string): ClientSafeDeliverableDetail {
  return {
    approvalItem: {
      clientId, deliverableId: "11111111-1111-4111-8111-111111111111",
      versionId: "version-b", expectedRevision: 1, isActionable: true,
      displayName: `Visible-${clientId}`, typeLabel: "منشور",
      status: "waiting_client_approval", statusLabel: "بانتظار الموافقة",
      versionLabel: "النسخة الحالية", dueDateLabel: "2026-09-12",
    },
    status: "waiting_client_approval", statusLabel: "بانتظار الموافقة",
    progressPercentage: 80, files: [], comments: [],
  };
}

// Only backend reads are substituted: route selection, permissions and UI remain real.
vi.mock("@/server/actions/commercial-summary-read", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/actions/commercial-summary-read")>();
  return {
    ...original,
    readCommercialSummary: async (scope: { tenantId: string; clientId: string }) => {
      boundary.scopes.push(scope);
      if (boundary.readFailure) return { ok: false, reason: "read_failed" };
      return { ok: true, value: {
        ...original.fixtureClientCommercialSummary,
        deliverables: original.fixtureClientCommercialSummary.deliverables.map((entry) => ({
          ...entry, name: `Visible-${scope.clientId}`,
        })),
      } };
    },
  };
});
vi.mock("@/server/actions/persistent-client-approval", () => ({
  decidePersistentClientVersion: vi.fn(),
  readPersistentClientApprovalInbox: async (scope: { tenantId: string; clientId: string }) => {
    boundary.scopes.push(scope);
    return boundary.readFailure ? [] : [detail(scope.clientId)];
  },
  readPersistentClientWorkDetail: async (scope: { tenantId: string; clientId: string }) => {
    boundary.scopes.push(scope);
    return !boundary.readFailure && scope.clientId === boundary.detailClient
      ? detail(scope.clientId) : undefined;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const query = {
        select: () => query,
        eq: (key: string, value: string) => { filters[key] = value; return query; },
        in: (key: string, values: string[]) => { filters[key] = values; return query; },
        or: () => query,
        maybeSingle: async () => ({
          data: !boundary.readFailure && table === "deliverables" &&
            filters.tenant_id === "tenant" &&
            Array.isArray(filters.client_id) && filters.client_id.includes(boundary.detailClient)
            ? { client_id: boundary.detailClient } : null,
          error: boundary.readFailure ? { message: "unavailable" } : null,
        }),
        order: async () => {
          const clientId = String(filters.client_id);
          boundary.scopes.push({ tenantId: String(filters.tenant_id), clientId });
          return {
            data: boundary.readFailure ? null : [{
              id: "file", file_name: `Visible-${clientId}`, file_type: "application/pdf",
              file_size: 100, visibility: "client_visible", version_number: 1,
              is_final: false, created_at: "2026-09-10", deliverable_id: null,
            }],
            error: boundary.readFailure ? { message: "unavailable" } : null,
          };
        },
      };
      return query;
    },
  }),
}));

function context(): Extract<RuntimeContext, { ok: true }> {
  return {
    ok: true,
    actor: {
      userId: "user", tenantId: "tenant",
      tenantMembership: { id: "member", userId: "user", tenantId: "tenant", status: "active" },
      roleAssignments: ["a", "b"].map((id) => ({
        id, tenantId: "tenant", membershipId: "member",
        roleKey: id === "a" ? "client_approver" : "client_viewer",
        scopeType: "client", scopeId: id, status: "active",
      })),
    },
    clients: ["a", "b", "c"].map((id) => ({
      id, name: `Workspace-${id}`, tenantId: "tenant", slug: id, status: "active",
      createdBy: "admin", createdAt: "2026-09-10", updatedAt: "2026-09-10", revision: 1,
    })),
    clientMemberships: ["a", "b"].map((id) => ({
      id, clientId: id, tenantId: "tenant", userId: "user", status: "active",
    })),
  };
}

const pages = [
  ["home", ClientHomePage], ["work", ClientWorkPage], ["pending", ClientPendingPage],
  ["files", ClientFilesPage], ["commercial", ClientCommercialPage],
] as const;
const markup = (content: ReactNode) => renderToStaticMarkup(createElement("div", null, content));

beforeEach(() => {
  vi.restoreAllMocks();
  boundary.runtime = context();
  boundary.preference = "b";
  boundary.fixtures = false;
  boundary.readFailure = false;
  boundary.detailClient = "b";
  boundary.scopes = [];
});

describe("SIL-44 real client route workspace integration", () => {
  it.each(pages)("%s reads and renders selected B, never first A", async (_name, page) => {
    const html = markup(await page({}));
    expect(boundary.scopes.length).toBeGreaterThan(0);
    expect(boundary.scopes.every((scope) => scope.tenantId === "tenant" && scope.clientId === "b")).toBe(true);
    expect(html).toContain("Visible-b");
    expect(html).not.toContain("Visible-a");
    expect(html).not.toContain("Workspace-c");
  });

  it.each(pages)("%s renders no business data when runtime fails", async (_name, page) => {
    boundary.runtime = { ok: false, reason: "runtime_unavailable" };
    expect(markup(await page({}))).not.toContain("Visible-");
    expect(boundary.scopes).toEqual([]);
  });

  it.each(pages)("%s renders no data after all client memberships are revoked", async (_name, page) => {
    const runtime = context();
    runtime.clientMemberships.forEach((membership) => { membership.status = "disabled"; });
    boundary.runtime = runtime;
    expect(markup(await page({}))).not.toContain("Visible-");
    expect(boundary.scopes).toEqual([]);
  });

  it.each(pages)("%s exposes no data on a failed backend read", async (_name, page) => {
    boundary.readFailure = true;
    expect(markup(await page({}))).not.toContain("Visible-");
  });

  it("detail B uses actual B viewer permission despite preference A approver", async () => {
    boundary.preference = "a";
    const html = markup(await ClientDetailPage({ params: Promise.resolve({
      deliverableId: "11111111-1111-4111-8111-111111111111",
    }) }));
    expect(html).toContain("Visible-b");
    expect(html).toContain("للاطلاع");
    expect(html).not.toContain("قرارك مطلوب");
    expect(html).not.toContain('name="clientApprovalAction"');
    expect(boundary.scopes).toEqual([expect.objectContaining({ tenantId: "tenant", clientId: "b" })]);
  });

  it("detail outside authorized clients does not reach the detail read", async () => {
    boundary.detailClient = "c";
    const html = markup(await ClientDetailPage({ params: Promise.resolve({
      deliverableId: "11111111-1111-4111-8111-111111111111",
    }) }));
    expect(html).not.toContain("Visible-");
    expect(boundary.scopes).toEqual([]);
  });

  it("detail B decision fields stay bound to B and its version with cookie A", async () => {
    const runtime = context();
    runtime.actor.roleAssignments[0].roleKey = "client_viewer";
    runtime.actor.roleAssignments[1].roleKey = "client_approver";
    boundary.runtime = runtime;
    boundary.preference = "a";
    const html = markup(await ClientDetailPage({ params: Promise.resolve({
      deliverableId: "11111111-1111-4111-8111-111111111111",
    }) }));
    expect(html).toContain('name="clientId" value="b"');
    expect(html).toContain('name="versionId" value="version-b"');
    expect(html).not.toContain('name="clientId" value="a"');
    expect(html).toContain("قرارك مطلوب");
  });

  it("fixture detail resolves the matching second authorized client, not preference or first client", async () => {
    const runtime = context();
    runtime.clients = runtime.clients.slice(0, 2).map((client, index) => ({
      ...client, id: index === 0 ? "client_b" : "client_a",
    }));
    runtime.actor.roleAssignments.forEach((assignment, index) => {
      assignment.scopeId = runtime.clients[index].id;
    });
    runtime.clientMemberships.forEach((membership, index) => {
      membership.clientId = runtime.clients[index].id;
    });
    boundary.fixtures = true;
    boundary.preference = "client_b";
    vi.spyOn(routeGuards, "resolveRouteRuntime").mockResolvedValueOnce(runtime);
    const fixture = fixtureClientCommercialSummary.deliverables[0];
    const html = markup(await ClientDetailPage({ params: Promise.resolve({
      deliverableId: fixture.id,
    }) }));
    expect(html).toContain(fixture.name);
    expect(html).toContain("للاطلاع");
    expect(boundary.scopes).toEqual([]);
  });

  it("layout offers only authorized workspaces and uses selected viewer navigation", async () => {
    const html = markup(await ClientLayout({ children: createElement("p", null, "Child") }));
    expect(html).toContain("Workspace-a");
    expect(html).toContain("Workspace-b");
    expect(html).not.toContain("Workspace-c");
    expect(html).toContain("قيد المراجعة");
    expect(html).not.toContain("بانتظار موافقتي");
  });
});
