import { describe, expect, it } from "vitest";

describe("rls baseline", () => {
  it("is wired without claiming database isolation", () => {
    expect("blocked-until-local-supabase").toContain("local-supabase");
  });
});
