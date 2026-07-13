import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv.find((value) =>
  ["--dry-run", "--apply", "--rollback"].includes(value),
);
const inputPath = process.env.S015_UAT_PROFILE_INPUT;
const runId = process.env.S015_UAT_PROFILE_RUN_ID;

if (!mode || !inputPath || !runId) {
  throw new Error(
    "PROFILE_SYNC_INPUT_REQUIRED: select --dry-run/--apply/--rollback and set the input path plus opaque run ID",
  );
}

if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(runId)) {
  throw new Error("PROFILE_SYNC_RUN_ID_INVALID");
}

const parsed = JSON.parse(await readFile(inputPath, "utf8"));
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidPattern.test(parsed.tenantId) || !Array.isArray(parsed.profiles)) {
  throw new Error("PROFILE_SYNC_PAYLOAD_INVALID");
}

const forbiddenKeys = new Set([
  "email",
  "password",
  "token",
  "credential",
  "serviceRoleKey",
]);

const profiles = parsed.profiles.map((profile) => {
  if (
    !profile ||
    Object.keys(profile).some((key) => forbiddenKeys.has(key)) ||
    !uuidPattern.test(profile.userId) ||
    typeof profile.displayName !== "string" ||
    profile.displayName.trim().length < 2 ||
    profile.displayName.trim().length > 120
  ) {
    throw new Error("PROFILE_SYNC_PROFILE_INVALID");
  }

  return {
    tenant_id: parsed.tenantId,
    user_id: profile.userId,
    display_name: profile.displayName.trim(),
    role_label:
      typeof profile.roleLabel === "string" && profile.roleLabel.trim()
        ? profile.roleLabel.trim().slice(0, 120)
        : null,
    avatar_url:
      typeof profile.avatarUrl === "string" && profile.avatarUrl.trim()
        ? profile.avatarUrl.trim().slice(0, 500)
        : null,
    sync_run_id: runId,
    updated_at: new Date().toISOString(),
  };
});

if (new Set(profiles.map((profile) => profile.user_id)).size !== profiles.length) {
  throw new Error("PROFILE_SYNC_DUPLICATE_USER");
}

if (mode === "--dry-run") {
  console.log(
    JSON.stringify({ status: "validated", category: "member_profiles", count: profiles.length }),
  );
  process.exit(0);
}

if (
  process.env.S015_TARGET_CATEGORY !== "uat" ||
  process.env.S015_UAT_CONFIRM_NON_PRODUCTION !== "1"
) {
  throw new Error("PROFILE_SYNC_NON_PRODUCTION_CONFIRMATION_REQUIRED");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("PROFILE_SYNC_UAT_CONNECTION_REQUIRED");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

if (mode === "--rollback") {
  const { error, count } = await supabase
    .from("member_profiles")
    .delete({ count: "exact" })
    .eq("tenant_id", parsed.tenantId)
    .eq("sync_run_id", runId);
  if (error) throw new Error(`PROFILE_SYNC_ROLLBACK_FAILED:${error.code ?? "unknown"}`);
  console.log(
    JSON.stringify({ status: "rolled_back", category: "member_profiles", count: count ?? 0 }),
  );
  process.exit(0);
}

const { error } = await supabase
  .from("member_profiles")
  .upsert(profiles, { onConflict: "tenant_id,user_id" });
if (error) throw new Error(`PROFILE_SYNC_APPLY_FAILED:${error.code ?? "unknown"}`);

console.log(
  JSON.stringify({ status: "applied", category: "member_profiles", count: profiles.length }),
);

