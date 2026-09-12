import { afterEach, describe, expect, it, vi } from "vitest";
import { initialDeliverableFormState } from "@/modules/deliverables/deliverable-form-state";
import { createDeliverableAction } from "@/server/actions/deliverables";

const {
  createDeliverableViaRpc,
  createSupabaseServerClient,
  evaluatePermission,
  resolveRuntimeContext,
} = vi.hoisted(() => ({
  createDeliverableViaRpc: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  evaluatePermission: vi.fn(),
  resolveRuntimeContext: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("@/server/auth/runtime-context", () => ({ resolveRuntimeContext }));
vi.mock("@/modules/authorization/evaluator", () => ({ evaluatePermission }));
vi.mock("@/server/actions/deliverable-write-rpc", () => ({
  createDeliverableViaRpc,
  createApprovedExtraDeliverableViaRpc: vi.fn(),
}));

const clientId = "00000000-0000-4000-8000-000000000101";

const validForm = () => {
  const formData = new FormData();
  formData.set("clientId", clientId);
  formData.set("contractId", "contract-a");
  formData.set("packageId", "package-a");
  formData.set("packageLineId", "line-a");
  formData.set("name", "منشورات الحملة");
  formData.set("type", "post");
  formData.set("priority", "normal");
  formData.set("reservedQuantity", "2");
  formData.set("idempotencyKey", "count-action-rejection");
  return formData;
};

afterEach(() => vi.clearAllMocks());

describe("create deliverable server action", () => {
  it("rejects more than one count unit before invoking the reservation RPC", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { unit_label: "منشور" },
        error: null,
      }),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn(() => chain) });
    resolveRuntimeContext.mockResolvedValue({
      ok: true,
      actor: { tenantId: "tenant-a" },
      clients: [{ id: clientId, tenantId: "tenant-a", status: "active" }],
    });
    evaluatePermission.mockReturnValue({ allowed: true });

    await expect(
      createDeliverableAction(initialDeliverableFormState, validForm()),
    ).resolves.toMatchObject({
      status: "error",
      message: "كل مخرج من وحدات العد يحجز وحدة واحدة فقط. أنشئ مخرجًا مستقلًا لكل وحدة.",
    });
    expect(createDeliverableViaRpc).not.toHaveBeenCalled();
  });
});
