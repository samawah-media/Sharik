import { afterEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

const validAttemptId = "31000000-0000-4000-8000-000000000780";

const buildSupabase = ({
  rpcData,
  rpcError = null,
  removeError = null,
}: {
  rpcData?: unknown;
  rpcError?: unknown;
  removeError?: { statusCode?: string } | null;
}) => {
  const remove = vi.fn().mockResolvedValue({ error: removeError });
  const from = vi.fn(() => ({ remove }));
  const rpc = vi.fn().mockResolvedValue({ data: rpcData, error: rpcError });
  createSupabaseServerClient.mockResolvedValue({
    rpc,
    storage: { from },
  });
  return { rpc, from, remove };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("cancelWorkspaceFileUpload", () => {
  it("deletes only the exact RPC-returned Storage path", async () => {
    const { cancelWorkspaceFileUpload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    const storagePath =
      "31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/cancel-target.txt";
    const { from, remove } = buildSupabase({
      rpcData: [{ bucket_id: "deliverable-assets", storage_path: storagePath }],
    });

    const result = await cancelWorkspaceFileUpload({
      attemptId: validAttemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });

    expect(result).toEqual({ ok: true, cleanup: "completed" });
    expect(from).toHaveBeenCalledWith("deliverable-assets");
    expect(remove).toHaveBeenCalledWith([storagePath]);
  }, 15_000);

  it("marks cleanup failed when RPC omits the path", async () => {
    const { cancelWorkspaceFileUpload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    const { from, remove } = buildSupabase({
      rpcData: [{ bucket_id: "deliverable-assets", storage_path: "" }],
    });

    const result = await cancelWorkspaceFileUpload({
      attemptId: validAttemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });

    expect(result).toEqual({ ok: true, cleanup: "failed" });
    expect(from).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("marks cleanup failed for an unexpected bucket", async () => {
    const { cancelWorkspaceFileUpload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    const { from, remove } = buildSupabase({
      rpcData: [{ bucket_id: "other-bucket", storage_path: "valid/path.txt" }],
    });

    const result = await cancelWorkspaceFileUpload({
      attemptId: validAttemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });

    expect(result).toEqual({ ok: true, cleanup: "failed" });
    expect(from).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("marks cleanup failed when Storage deletion fails", async () => {
    const { cancelWorkspaceFileUpload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    buildSupabase({
      rpcData: [{ bucket_id: "deliverable-assets", storage_path: "valid/path.txt" }],
      removeError: { statusCode: "500" },
    });

    const result = await cancelWorkspaceFileUpload({
      attemptId: validAttemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });

    expect(result).toEqual({ ok: true, cleanup: "failed" });
  });

  it("treats Storage 404 as already cleaned", async () => {
    const { cancelWorkspaceFileUpload } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );
    buildSupabase({
      rpcData: [{ bucket_id: "deliverable-assets", storage_path: "valid/path.txt" }],
      removeError: { statusCode: "404" },
    });

    const result = await cancelWorkspaceFileUpload({
      attemptId: validAttemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });

    expect(result).toEqual({ ok: true, cleanup: "completed" });
  });
});
