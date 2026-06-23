import { z } from "zod";

type EnvInput = Record<string, string | undefined>;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_ENV: z.enum(["local", "development", "test"]).default("local"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parsePublicEnv(
  env: EnvInput = process.env,
): PublicEnv {
  return publicEnvSchema.parse(env);
}

export function parseServerEnv(
  env: EnvInput = process.env,
): ServerEnv {
  return serverEnvSchema.parse(env);
}
