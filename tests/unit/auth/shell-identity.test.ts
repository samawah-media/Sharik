import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readShellIdentity } from "@/server/auth/shell-identity";
import type { AuthorizationActor } from "@/modules/authorization/evaluator";
import type { RoleKey } from "@/modules/memberships/membership";

const tenantId = "10000000-0000-4000-8000-000000000001";
const otherTenantId = "10000000-0000-4000-8000-000000000099";
const userId = "30000000-0000-4000-8000-000000000002";
const membershipId = "40000000-0000-4000-8000-000000000002";

const roleAssignment = (
  id: string,
  roleKey: RoleKey | string,
  status: "active" | "disabled" | "removed",
) => ({
  id,
  tenantId,
  membershipId,
  roleKey: roleKey as RoleKey,
  scopeType: "tenant" as const,
  scopeId: tenantId,
  status,
});

const actorWith = (
  roleAssignments: ReturnType<typeof roleAssignment>[],
): AuthorizationActor => ({
  userId,
  tenantId,
  tenantMembership: {
    id: membershipId,
    tenantId,
    userId,
    status: "active",
  },
  roleAssignments,
});

// Mock only the external Supabase query boundary; the profile read itself
// must stay a real, hand-verifiable query chain.
const queryChainFor = (result: { data: unknown; error: unknown }) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
};

const supabaseFor = (
  chain: ReturnType<typeof queryChainFor>,
): SupabaseClient =>
  ({ from: vi.fn(() => chain) }) as unknown as SupabaseClient;

describe("readShellIdentity", () => {
  it("queries member_profiles scoped to the actor's exact tenant and user, selecting only presentation fields", async () => {
    // Break caught: a query missing either scope filter could render another
    // tenant's profile or the wrong member inside the management shell.
    const chain = queryChainFor({ data: { display_name: "نورة الشمري" }, error: null });
    const supabase = supabaseFor(chain);

    const identity = await readShellIdentity({
      supabase,
      actor: actorWith([roleAssignment("60000000-0000-4000-8000-000000000001", "designer", "active")]),
    });

    expect(supabase.from).toHaveBeenCalledExactlyOnceWith("member_profiles");
    expect(chain.select).toHaveBeenCalledExactlyOnceWith("display_name");
    expect(chain.eq).toHaveBeenNthCalledWith(1, "tenant_id", tenantId);
    expect(chain.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
    expect(chain.maybeSingle).toHaveBeenCalledOnce();
    expect(identity).toEqual({
      displayName: "نورة الشمري",
      roleLabels: ["المصمم"],
    });
  });

  it("returns safe presentation fallbacks when the profile read errors or is missing", async () => {
    // Break caught: a failed read must never surface partial data, raw
    // identifiers, or an empty role list in the shell.
    const failing = await readShellIdentity({
      supabase: supabaseFor(
        queryChainFor({ data: null, error: { message: "database unavailable" } }),
      ),
      actor: actorWith([roleAssignment("60000000-0000-4000-8000-000000000001", "designer", "active")]),
    });

    const missing = await readShellIdentity({
      supabase: supabaseFor(queryChainFor({ data: null, error: null })),
      actor: actorWith([roleAssignment("60000000-0000-4000-8000-000000000001", "designer", "active")]),
    });

    const expectedFallback = { displayName: "عضو فريق", roleLabels: ["عضو فريق"] };
    expect(failing).toEqual(expectedFallback);
    expect(missing).toEqual(expectedFallback);
  });

  it("derives unique Arabic role labels from active assignments only", async () => {
    // Break caught: duplicate or inactive roles would render a confusing or
    // stale identity in the shell.
    const identity = await readShellIdentity({
      supabase: supabaseFor(
        queryChainFor({ data: { display_name: "سارة" }, error: null }),
      ),
      actor: actorWith([
        roleAssignment("60000000-0000-4000-8000-000000000001", "designer", "active"),
        roleAssignment("60000000-0000-4000-8000-000000000002", "designer", "active"),
        roleAssignment("60000000-0000-4000-8000-000000000003", "account_manager", "active"),
        roleAssignment("60000000-0000-4000-8000-000000000004", "content_writer", "removed"),
        roleAssignment("60000000-0000-4000-8000-000000000005", "tenant_administrator", "disabled"),
      ]),
    });

    expect(identity).toEqual({
      displayName: "سارة",
      roleLabels: ["المصمم", "مدير الحساب"],
    });
  });

  it("falls back to the safe team-member role label when no active assignments exist", async () => {
    const identity = await readShellIdentity({
      supabase: supabaseFor(queryChainFor({ data: { display_name: "سارة" }, error: null })),
      actor: actorWith([
        roleAssignment("60000000-0000-4000-8000-000000000004", "designer", "removed"),
      ]),
    });

    expect(identity).toEqual({
      displayName: "سارة",
      roleLabels: ["عضو فريق"],
    });
  });

  it("never returns extra identity fields, unsafe names, or raw role enums from the query boundary", async () => {
    // Break caught: unsafe display values (uuid/email-like) and unexpected
    // extra columns returned by a loose boundary must not reach presentation.
    const identity = await readShellIdentity({
      supabase: supabaseFor(
        queryChainFor({
          data: {
            display_name: "30000000-0000-4000-8000-000000000002",
            user_id: userId,
            tenant_id: otherTenantId,
            email: "member@preview.example.test",
          },
          error: null,
        }),
      ),
      actor: actorWith([
        roleAssignment("60000000-0000-4000-8000-000000000001", "designer", "active"),
        roleAssignment("60000000-0000-4000-8000-000000000003", "account_manager", "active"),
      ]),
    });

    expect(identity.displayName).toBe("عضو فريق");
    expect(Object.keys(identity).sort()).toEqual(["displayName", "roleLabels"]);
    const serialized = JSON.stringify(identity);
    expect(serialized).not.toContain(tenantId);
    expect(serialized).not.toContain(otherTenantId);
    expect(serialized).not.toContain(userId);
    expect(serialized).not.toContain("designer");
    expect(serialized).not.toContain("account_manager");
    expect(serialized).not.toContain("@");
  });
});
