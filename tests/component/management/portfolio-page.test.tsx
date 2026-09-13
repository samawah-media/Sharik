import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortfolioPage from "@/app/(management)/portfolio/page";
import { listScopedDeliverables } from "@/server/actions/deliverable-read";
import { resolveRouteActor, resolveRouteRuntime, routeClients } from "@/server/navigation/route-guards";

vi.mock("@/server/actions/deliverable-read", () => ({ listScopedDeliverables: vi.fn() }));
vi.mock("@/server/navigation/route-guards", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/navigation/route-guards")>();
  return { ...original, resolveRouteRuntime: vi.fn(), canUseRouteActorFixtures: () => false };
});

type ScopedDeliverableItem = Extract<
  Awaited<ReturnType<typeof listScopedDeliverables>>,
  { ok: true }
>["deliverables"][number];

const item: ScopedDeliverableItem = {
  id: "ui2-delivered", tenantId: "tenant_a", clientId: "client_a",
  name: "تصميم تم تسليمه", type: "post", status: "delivered", priority: "normal",
  ownerUserId: "tenant_admin_a", contributorUserIds: [],
  ownerDisplay: { userId: "tenant_admin_a", displayName: "أحمد العتيبي", initial: "أ" },
  contributorDisplays: [],
  requiresInternalApproval: true, requiresClientApproval: true,
  progressPercentage: 100, approvedExtra: false, revision: 1,
  createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-08T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_ENV", "test");
  vi.mocked(resolveRouteRuntime).mockResolvedValue({
    ok: true, actor: resolveRouteActor("tenant_admin_a"),
    clients: routeClients, clientMemberships: [],
  });
  vi.mocked(listScopedDeliverables).mockResolvedValue({ ok: true, deliverables: [] });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function openPage() {
  render(await PortfolioPage({}));
}

describe("PortfolioPage complete snapshot boundary", () => {
  it("renders a real successful snapshot using tenant/client scoped reads", async () => {
    vi.mocked(listScopedDeliverables).mockImplementation(async ({ tenantId, clientId }) => {
      if (tenantId !== "tenant_a") throw new Error("unexpected tenant");
      return { ok: true, deliverables: clientId === "client_a" ? [item] : [] };
    });
    await openPage();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /تصميم تم تسليمه/ })).toHaveAttribute("href", "/clients/client_a/deliverables");
    expect(listScopedDeliverables).toHaveBeenCalledTimes(2);
    expect(listScopedDeliverables).toHaveBeenCalledWith({ tenantId: "tenant_a", clientId: "client_a" });
    expect(listScopedDeliverables).toHaveBeenCalledWith({ tenantId: "tenant_a", clientId: "client_b" });
  });

  it("distinguishes successful empty data from unavailable data", async () => {
    await openPage();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "أحدث القرارات والتسليمات" })).toBeInTheDocument();
  });

  it("retains the existing no-assigned-client guard without issuing reads", async () => {
    vi.mocked(resolveRouteRuntime).mockResolvedValue({
      ok: true, actor: resolveRouteActor("tenant_admin_a"), clients: [], clientMemberships: [],
    });
    await openPage();
    expect(screen.getByText("ستظهر هنا المساحات بعد إسناد عميل لك من الإدارة.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listScopedDeliverables).not.toHaveBeenCalled();
  });

  it.each(["partial", "all", "throw"] as const)("suppresses incomplete totals after %s read failure, retaining safe client links", async (failure) => {
    vi.mocked(listScopedDeliverables).mockImplementation(async ({ clientId }) => {
      if (failure === "throw" && clientId === "client_b") throw new Error("private database detail");
      if (failure === "all" || (failure === "partial" && clientId === "client_b")) return { ok: false };
      return { ok: true, deliverables: [item] };
    });
    await openPage();
    expect(screen.getByRole("alert")).toHaveTextContent("ما قدرنا نحمّل ملخص الأعمال.");
    expect(screen.queryByRole("region", { name: "يحتاج انتباهكم" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "وين وصل الشغل؟" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "التسليم حسب العميل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "أحدث القرارات والتسليمات" })).not.toBeInTheDocument();
    expect(screen.queryByText(/تصميم تم تسليمه/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private database detail/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^فتح هدنة$/ })).toHaveAttribute("href", "/clients/client_a");
  });

  it("keeps the actual role guard before any scoped reads", async () => {
    vi.mocked(resolveRouteRuntime).mockResolvedValue({
      ok: true, actor: resolveRouteActor("client_viewer_a"), clients: routeClients, clientMemberships: [],
    });
    await openPage();
    expect(listScopedDeliverables).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "أحدث القرارات والتسليمات" })).not.toBeInTheDocument();
  });
});
