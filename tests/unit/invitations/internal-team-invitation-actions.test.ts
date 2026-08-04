import { afterEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, revalidatePath } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

const validToken = "a".repeat(64);
const validClient = "00000000-0000-4000-8000-000000000101";

afterEach(() => {
  vi.clearAllMocks();
});

describe("internal team invitation server actions", () => {
  it("returns an honest read failure instead of an empty success", async () => {
    createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });
    const { listInternalTeamInvitations } = await import(
      "@/server/actions/internal-team-invitations"
    );

    await expect(listInternalTeamInvitations()).resolves.toEqual({
      ok: false,
      reason: "read_failed",
      invitations: [],
    });
  });

  it("returns a one-time manual invitation link only after RPC success", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ invitation_token: validToken }],
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue({ rpc });
    const { createInternalTeamInvitationAction } = await import(
      "@/server/actions/internal-team-invitations"
    );
    const { initialInvitationActionState } = await import(
      "@/modules/invitations/internal-team-invitation-state"
    );
    const formData = new FormData();
    formData.set("displayName", "سارة المصممة");
    formData.set("email", "sara@example.test");
    formData.set("roleKey", "designer");
    formData.set("clientId", validClient);
    formData.set("invitationToken", validToken);
    formData.set("idempotencyKey", "s015-invite-unit-test");

    const result = await createInternalTeamInvitationAction(
      initialInvitationActionState,
      formData,
    );

    expect(result).toMatchObject({
      status: "success",
      invitationPath: `/invite/${validToken}`,
    });
    expect(rpc).toHaveBeenCalledWith(
      "s015_invite_internal_team_member_v2",
      expect.objectContaining({
        invited_display_name_input: "سارة المصممة",
        target_client_id: validClient,
        invitation_token_input: validToken,
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/invitations/internal");
  });

  it("does not claim success when the mutation is denied", async () => {
    createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });
    const { createInternalTeamInvitationAction } = await import(
      "@/server/actions/internal-team-invitations"
    );
    const { initialInvitationActionState } = await import(
      "@/modules/invitations/internal-team-invitation-state"
    );
    const formData = new FormData();
    formData.set("displayName", "سارة المصممة");
    formData.set("email", "sara@example.test");
    formData.set("roleKey", "designer");
    formData.set("clientId", validClient);
    formData.set("invitationToken", validToken);
    formData.set("idempotencyKey", "s015-invite-denied-test");

    await expect(
      createInternalTeamInvitationAction(initialInvitationActionState, formData),
    ).resolves.toMatchObject({ status: "error" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
