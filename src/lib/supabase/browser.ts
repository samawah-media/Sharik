import { createBrowserClient } from "@supabase/ssr";
import { parsePublicEnv } from "@/server/config/env";

export function createSupabaseBrowserClient() {
  const env = parsePublicEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
