import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "@/server/config/env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "local-service-role-key",
  APP_ENV: "local",
};

describe("environment validation", () => {
  it("rejects missing server-only values", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          validEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }),
    ).toThrow();
  });

  it("does not expose server-only values through the public parser", () => {
    expect(parsePublicEnv(validEnv)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        validEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
  });
});
