import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeContext } from "@/server/auth/runtime-context";
import {
  readClientWorkspace,
  readClientForDeliverable,
} from "@/server/navigation/client-workspace";
import { selectClientWorkspaceAction } from "@/server/actions/select-client-workspace";

const mocks = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  cookieUnavailable: false,
  set: vi.fn(),
  resolve: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => {
    if (mocks.cookieUnavailable) throw new Error("private cookie details");
    return {
      get: () => (mocks.cookie ? { value: mocks.cookie } : undefined),
      set: mocks.set,
    };
  },
}));
vi.mock("@/server/auth/runtime-context", () => ({
  resolveRuntimeContext: mocks.resolve,
}));
const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const c = "33333333-3333-4333-8333-333333333333";
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
      roleAssignments: [a, b].map((id) => ({
        id,
        tenantId: "tenant",
        membershipId: "member",
        scopeType: "client",
        scopeId: id,
        roleKey: "client_approver",
        status: "active",
      })),
    },
    clients: [a, b, c].map((id) => ({
      id,
      tenantId: "tenant",
      name: id,
      slug: id,
      status: "active",
      createdBy: "admin",
      createdAt: "2026-09-10",
      updatedAt: "2026-09-10",
      revision: 1,
    })),
    clientMemberships: [a, b].map((id) => ({
      id,
      tenantId: "tenant",
      userId: "user",
      clientId: id,
      status: "active",
    })),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie = undefined;
  mocks.cookieUnavailable = false;
  mocks.set.mockReset();
  mocks.resolve.mockResolvedValue(context());
});
describe("workspace session preference", () => {
  it.each(["acquire", "write"])(
    "does not report success when cookie %s fails",
    async (failure) => {
      if (failure === "acquire") mocks.cookieUnavailable = true;
      else
        mocks.set.mockImplementation(() => {
          throw new Error("private cookie details");
        });
      const result = await selectClientWorkspaceAction(b);
      expect(result.ok).toBe(false);
      expect(JSON.stringify(result)).not.toContain("private cookie");
      if (failure === "acquire") expect(mocks.set).not.toHaveBeenCalled();
    },
  );
  it("writes an authenticated authorized selection and reads it on the next request", async () => {
    expect(await selectClientWorkspaceAction(b)).toEqual({ ok: true });
    expect(mocks.set).toHaveBeenCalledWith(
      "samawah-client-workspace",
      `user.tenant.${b}`,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/client",
      }),
    );
    mocks.cookie = mocks.set.mock.calls[0][1];
    expect((await readClientWorkspace(context())).selectedClient?.id).toBe(b);
  });
  it.each([c, "", "not-a-uuid"])(
    "does not write unauthorized or malformed choice %s",
    async (id) => {
      expect((await selectClientWorkspaceAction(id)).ok).toBe(false);
      expect(mocks.set).not.toHaveBeenCalled();
    },
  );
  it("does not retain a revoked selection", async () => {
    mocks.cookie = `user.tenant.${b}`;
    const runtime = context();
    runtime.clientMemberships[1].status = "disabled";
    mocks.resolve.mockResolvedValue(runtime);
    expect((await selectClientWorkspaceAction(b)).ok).toBe(false);
    expect((await readClientWorkspace(runtime)).selectedClient?.id).toBe(a);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each([
    `other.tenant.${b}`,
    `user.other.${b}`,
    `garbage`,
    `user.tenant.${c}`,
  ])("ignores stale or forged cookie %s", async (cookie) => {
    mocks.cookie = cookie;
    expect((await readClientWorkspace(context())).selectedClient?.id).toBe(a);
  });
  it("fails closed when authentication lookup fails", async () => {
    mocks.resolve.mockResolvedValue({
      ok: false,
      reason: "runtime_unavailable",
    });
    expect((await selectClientWorkspaceAction(b)).ok).toBe(false);
    expect(mocks.set).not.toHaveBeenCalled();
    expect(
      await readClientWorkspace({ ok: false, reason: "runtime_unavailable" }),
    ).toEqual({ clients: [], selectedClient: undefined });
  });
  it("surfaces thrown lookup failure without cookie write", async () => {
    mocks.resolve.mockRejectedValue(new Error("private backend details"));
    const result = await selectClientWorkspaceAction(b);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private backend");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
describe("detail workspace is resource scoped", () => {
  it.each([
    {
      label: "lookup error",
      data: { client_id: b },
      error: { message: "unavailable" },
    },
    { label: "not found", data: null, error: null },
    { label: "unexpected client", data: { client_id: c }, error: null },
  ])("returns no client for $label", async ({ data, error }) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: async () => ({ data, error }),
    };
    expect(
      await readClientForDeliverable({
        runtime: context(),
        supabase: { from: () => query } as never,
        deliverableId: c,
      }),
    ).toBeUndefined();
  });
  it("resolves the deliverable client independently of cookie and scopes the lookup", async () => {
    mocks.cookie = `user.tenant.${a}`;
    const eq = vi.fn().mockReturnThis();
    const inScope = vi.fn().mockReturnThis();
    const query = {
      select: vi.fn().mockReturnThis(),
      eq,
      in: inScope,
      maybeSingle: async () => ({ data: { client_id: b }, error: null }),
    };
    const supabase = { from: vi.fn(() => query) };
    expect(
      (
        await readClientForDeliverable({
          runtime: context(),
          supabase: supabase as never,
          deliverableId: c,
        })
      )?.id,
    ).toBe(b);
    expect(eq).toHaveBeenCalledWith("tenant_id", "tenant");
    expect(eq).toHaveBeenCalledWith("id", c);
    expect(inScope).toHaveBeenCalledWith("client_id", [a, b]);
  });
  it("returns no resource when there are no authorized workspaces", async () => {
    const supabase = { from: vi.fn() };
    expect(
      await readClientForDeliverable({
        runtime: { ok: false, reason: "access_denied" },
        supabase: supabase as never,
        deliverableId: c,
      }),
    ).toBeUndefined();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
