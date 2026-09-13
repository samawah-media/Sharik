import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadActivePackageRows } from "@/app/(management)/clients/[clientId]/deliverables/new/page";

const packageQuery = () => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  return query;
};

describe("new deliverable package selection", () => {
  it("scopes an explicit package to tenant, client, active status, and exact ID", async () => {
    const query = packageQuery();
    const supabase = { from: vi.fn(() => query) };

    await loadActivePackageRows({
      supabase: supabase as never,
      tenantId: "tenant_a",
      clientId: "client_a",
      requestedPackageId: "package_a",
    });

    expect(query.eq.mock.calls).toEqual([
      ["tenant_id", "tenant_a"],
      ["client_id", "client_a"],
      ["status", "active"],
      ["id", "package_a"],
    ]);
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it("keeps latest-active selection when no package ID is requested", async () => {
    const query = packageQuery();
    const supabase = { from: vi.fn(() => query) };

    await loadActivePackageRows({
      supabase: supabase as never,
      tenantId: "tenant_a",
      clientId: "client_a",
    });

    expect(query.eq.mock.calls).toEqual([
      ["tenant_id", "tenant_a"],
      ["client_id", "client_a"],
      ["status", "active"],
    ]);
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
  });
});
