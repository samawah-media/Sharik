import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/server/auth/runtime-context", () => ({
  resolveRuntimeContext: vi.fn(),
}));

import HomePage from "@/app/page";
import { redirect } from "next/navigation";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";

const mockedRedirect = vi.mocked(redirect);
const mockedResolveRuntimeContext = vi.mocked(resolveRuntimeContext);

describe("application shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated root visits to sign-in", async () => {
    mockedResolveRuntimeContext.mockResolvedValue({
      ok: false,
      reason: "auth_required",
    });

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    expect(mockedRedirect).toHaveBeenCalledWith("/sign-in");
  });
});
