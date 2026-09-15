import { afterEach, describe, expect, it, vi } from "vitest";
import { initialInvitationActionState } from "@/modules/invitations/internal-team-invitation-state";
import {
  createInternalTeamInvitationAction,
  listInternalTeamInvitations,
} from "@/server/actions/internal-team-invitations";

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
const secondValidClient = "00000000-0000-4000-8000-000000000102";

afterEach(() => {
  vi.clearAllMocks();
});

describe("internal team invitation server actions", () => {
  it("returns an honest read failure instead of an empty success", async () => {
    createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });

    await expect(listInternalTeamInvitations()).resolves.toEqual({
      ok: false,
      reason: "read_failed",
      invitations: [],
    });
  });

  it("maps one invitation with all scoped clients instead of duplicate rows", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000201",
          tenant_id: "00000000-0000-4000-8000-000000000001",
          invited_display_name: "سارة المصممة",
          invited_email: "sara@example.test",
          role_key: "designer",
          client_ids: [validClient, secondValidClient],
          client_names: ["هدنة", "جلس"],
          status: "pending",
          delivery_state: "queued",
          expires_at: "2026-09-08T00:00:00.000Z",
          created_at: "2026-09-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue({ rpc });

    const result = await listInternalTeamInvitations();

    expect(result).toMatchObject({
      ok: true,
      invitations: [
        {
          invitedDisplayName: "سارة المصممة",
          clientIds: [validClient, secondValidClient],
          clientNames: ["هدنة", "جلس"],
        },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("s015_list_internal_team_invitations_v3");
  });

  it("returns a one-time manual invitation link only after RPC success", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ invitation_token: validToken }],
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue({ rpc });
    const formData = new FormData();
    formData.set("displayName", "سارة المصممة");
    formData.set("email", "sara@example.test");
    formData.set("roleKey", "designer");
    formData.append("clientIds", validClient);
    formData.append("clientIds", secondValidClient);
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
      "s015_invite_internal_team_member_v3",
      expect.objectContaining({
        invited_display_name_input: "سارة المصممة",
        target_client_ids: [validClient, secondValidClient],
        invitation_token_input: validToken,
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/invitations/internal");
  });

  it("does not claim success when the mutation is denied", async () => {
    createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });
    const formData = new FormData();
    formData.set("displayName", "سارة المصممة");
    formData.set("email", "sara@example.test");
    formData.set("roleKey", "designer");
    formData.append("clientIds", validClient);
    formData.set("invitationToken", validToken);
    formData.set("idempotencyKey", "s015-invite-denied-test");

    await expect(
      createInternalTeamInvitationAction(initialInvitationActionState, formData),
    ).resolves.toMatchObject({ status: "error" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects risky empty role/client defaults before calling PostgreSQL", async () => {
    const rpc = vi.fn();
    createSupabaseServerClient.mockResolvedValue({ rpc });
    const formData = new FormData();
    formData.set("displayName", "سارة المصممة");
    formData.set("email", "sara@example.test");
    formData.set("invitationToken", validToken);
    formData.set("idempotencyKey", "s015-invite-explicit-test");

    await expect(
      createInternalTeamInvitationAction(initialInvitationActionState, formData),
    ).resolves.toMatchObject({ status: "error" });
    expect(rpc).not.toHaveBeenCalled();
  });
});
