import { afterEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

const fileId = "31000000-0000-4000-8000-000000000790";
const storagePath =
  "31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/final/review.png";

const buildSupabase = ({
  rpcData,
  rpcError = null,
  signedData = { signedUrl: "https://storage.example.test/signed-object" },
  signedError = null,
}: {
  rpcData?: unknown;
  rpcError?: unknown;
  signedData?: { signedUrl?: string } | null;
  signedError?: unknown;
}) => {
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue({ data: signedData, error: signedError });
  const from = vi.fn(() => ({ createSignedUrl }));
  const rpc = vi.fn().mockResolvedValue({ data: rpcData, error: rpcError });
  createSupabaseServerClient.mockResolvedValue({ rpc, storage: { from } });
  return { rpc, from, createSignedUrl };
};

afterEach(() => vi.clearAllMocks());

describe("createWorkspaceFileDownload", () => {
  it("fails closed before creating a server client for an invalid id", async () => {
    const { createWorkspaceFileDownload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );

    await expect(createWorkspaceFileDownload("not-a-uuid")).resolves.toEqual({
      ok: false,
      reason: "invalid_input",
    });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("fails closed when the authorization RPC denies the file", async () => {
    const { createWorkspaceFileDownload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    const { from } = buildSupabase({ rpcData: null, rpcError: { code: "42501" } });

    await expect(createWorkspaceFileDownload(fileId)).resolves.toEqual({
      ok: false,
      reason: "denied",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("uses only RPC metadata, a plain 60-second signed URL, and returns the safe name", async () => {
    const { createWorkspaceFileDownload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    const { rpc, from, createSignedUrl } = buildSupabase({
      rpcData: [
        {
          bucket_id: "deliverable-assets",
          storage_path: storagePath,
          file_name: "قالب الآراء\r\n.png",
        },
      ],
    });

    await expect(createWorkspaceFileDownload(fileId)).resolves.toEqual({
      ok: true,
      url: "https://storage.example.test/signed-object",
      fileName: "قالب الآراء.png",
    });
    expect(rpc).toHaveBeenCalledWith("s015_authorize_file_download", {
      target_file_id: fileId,
    });
    expect(from).toHaveBeenCalledWith("deliverable-assets");
    expect(createSignedUrl).toHaveBeenCalledWith(storagePath, 60);
  });
});
