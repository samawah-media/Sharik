import { describe, expect, it } from "vitest";
import { getSafeRedirectPath, signInSchema } from "@/modules/auth/sign-in";

describe("sign-in helpers", () => {
  it("accepts only local redirect paths after authentication", () => {
    expect(getSafeRedirectPath("/portfolio")).toBe("/portfolio");
    expect(getSafeRedirectPath("/clients?tab=active")).toBe("/clients?tab=active");
    expect(getSafeRedirectPath("https://evil.example")).toBe("/");
    expect(getSafeRedirectPath("//evil.example")).toBe("/");
    expect(getSafeRedirectPath("clients")).toBe("/");
  });

  it("returns safe Arabic validation errors for missing credentials", () => {
    const result = signInSchema.safeParse({ email: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "أدخل بريدًا إلكترونيًا صحيحًا.",
      "أدخل كلمة المرور.",
    ]);
  });
});
