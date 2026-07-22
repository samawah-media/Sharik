import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decidePersistentClientVersion } from "@/server/actions/persistent-client-approval";

const validInput = {
  clientId: "00000000-0000-4000-8000-000000000001",
  deliverableId: "00000000-0000-4000-8000-000000000002",
  versionId: "00000000-0000-4000-8000-000000000003",
  decision: "approved" as const,
  comment: "موافق",
  idempotencyKey: "s015-client-decision-1",
};

describe("Spec 015 persistent client decision", () => {
  it("rejects malformed scoped identifiers before invoking the database", async () => {
    const rpc = vi.fn();
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: { ...validInput, clientId: "client-a" },
    });

    expect(result).toEqual({ ok: false, reason: "invalid_input" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("binds the RPC decision to exact client, deliverable, version, and idempotency scopes", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: validInput,
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "s015_client_decide_version",
      expect.objectContaining({
        target_client_id: validInput.clientId,
        target_deliverable_id: validInput.deliverableId,
        target_version_id: validInput.versionId,
        target_decision: "approved",
        request_idempotency_key: validInput.idempotencyKey,
      }),
    );
  });

  it("returns a safe denial when the database rejects stale or cross-scope input", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    const result = await decidePersistentClientVersion({
      supabase: { rpc } as unknown as SupabaseClient,
      input: { ...validInput, decision: "changes_requested" },
    });

    expect(result).toEqual({ ok: false, reason: "denied" });
  });
});
