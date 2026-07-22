import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executePersistentInternalWorkflow } from "@/server/actions/persistent-internal-workflow";

const scoped = {
  clientId: "00000000-0000-4000-8000-000000000011",
  deliverableId: "00000000-0000-4000-8000-000000000012",
  versionId: "00000000-0000-4000-8000-000000000013",
  command: "request_internal_changes" as const,
  comment: "يحتاج تعديل",
  idempotencyKey: "s015-internal-change-1",
};

describe("Spec 015 persistent internal workflow", () => {
  it("rejects malformed scope before RPC execution", async () => {
    const rpc = vi.fn();
    const result = await executePersistentInternalWorkflow({
      supabase: { rpc } as unknown as SupabaseClient,
      input: { ...scoped, versionId: "wrong-version" },
    });
    expect(result).toEqual({ ok: false, reason: "invalid_input" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("binds internal change requests to the exact scoped version", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const result = await executePersistentInternalWorkflow({
      supabase: { rpc } as unknown as SupabaseClient,
      input: scoped,
    });
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "s015_execute_internal_workflow",
      expect.objectContaining({
        target_client_id: scoped.clientId,
        target_deliverable_id: scoped.deliverableId,
        target_version_id: scoped.versionId,
        target_command: "request_internal_changes",
      }),
    );
  });

  it("passes version numbering only for version submission", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await executePersistentInternalWorkflow({
      supabase: { rpc } as unknown as SupabaseClient,
      input: {
        ...scoped,
        command: "submit_version",
        versionNumber: 3,
      },
    });
    expect(rpc).toHaveBeenCalledWith(
      "s015_execute_internal_workflow",
      expect.objectContaining({ target_version_number: 3 }),
    );
  });
});
