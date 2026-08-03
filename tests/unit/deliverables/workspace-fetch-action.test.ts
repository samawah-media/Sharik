import { afterEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("fetchDeliverableWorkspace fixture boundary", () => {
  it("loads an approved non-UUID fixture only in fixture mode", async () => {
    vi.stubEnv("APP_ENV", "test");
    const { fetchDeliverableWorkspace } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );

    const result = await fetchDeliverableWorkspace({
      clientId: "client_a",
      deliverableId: "hadna_deliverable_1",
      currentVersionId: "hadna_version_1",
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.workspace.deliverableId).toBe(
      "hadna_deliverable_1",
    );
    expect(result.ok && result.workspace.versions).toHaveLength(1);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects an unknown fixture without touching Supabase", async () => {
    vi.stubEnv("APP_ENV", "test");
    const { fetchDeliverableWorkspace } = await import(
      "@/server/actions/deliverable-workspace-actions"
    );

    const result = await fetchDeliverableWorkspace({
      clientId: "client_a",
      deliverableId: "unknown_fixture",
      currentVersionId: null,
    });

    expect(result).toEqual({ ok: false, reason: "denied" });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
