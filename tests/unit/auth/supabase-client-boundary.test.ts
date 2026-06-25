import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("Supabase client boundaries", () => {
  it("keeps service-role configuration out of the browser client", async () => {
    const browserClientSource = await readFile(
      path.join(projectRoot, "src", "lib", "supabase", "browser.ts"),
      "utf8",
    );

    expect(browserClientSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserClientSource).not.toContain("parseServerEnv");
    expect(browserClientSource).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
});
